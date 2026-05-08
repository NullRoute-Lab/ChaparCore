#!/usr/bin/env bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# generate_polymorphic_gs.sh — AST-unique mutator for Code.gs
#
# Produces a functionally equivalent but structurally unique variant of
# Code.gs for each deployment, defeating Google anti-abuse AST fingerprinting
# and line-based fuzzy hashing.
#
# Mutations applied:
#   1. Function name randomization  (hex suffix on all internal symbols)
#   2. Variable name randomization  (globals get unique prefixes)
#   3. Property key randomization   (count_ → ctr_XXXX_)
#   4. Junk comment injection       (4–8 random comments at random lines)
#   5. Dead code injection          (3 syntactically valid dead functions)
#
# Usage:
#   ./scripts/generate_polymorphic_gs.sh [INPUT] [OUTPUT]
#   ./scripts/generate_polymorphic_gs.sh                          # defaults
#
# Defaults:
#   INPUT  = apps_script/Code.gs
#   OUTPUT = apps_script/Code_Deployable.gs
#
# Requirements: bash, sed, awk, od, sort, wc, mktemp
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -euo pipefail

# ── Relative Pathing Resilience ──────────────────────────────────────────────
# Resolve the path to the script directory to correctly locate the repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# ── Configuration ────────────────────────────────────────────────────────────
INPUT="${1:-$REPO_ROOT/apps_script/Code.gs}"
OUTPUT="${2:-$REPO_ROOT/apps_script/Code_Deployable.gs}"

# ── Validate input ───────────────────────────────────────────────────────────
if [[ ! -f "$INPUT" ]]; then
  echo "error: input file not found: $INPUT" >&2
  exit 1
fi

INPUT_DIR="$(dirname "$OUTPUT")"
if [[ ! -d "$INPUT_DIR" ]]; then
  mkdir -p "$INPUT_DIR"
fi

# ── Generate random suffixes from /dev/urandom ───────────────────────────────
# Primary suffix: 10 hex chars (applied to function names)
SFX=$(od -An -tx1 -N5 /dev/urandom | tr -d ' \n')
if [[ -z "$SFX" ]]; then
  echo "error: failed to generate random suffix" >&2
  exit 1
fi

# Secondary suffix: 6 hex chars (applied to property key prefix)
SFX2=$(od -An -tx1 -N3 /dev/urandom | tr -d ' \n')

# ── Step 1: Function and variable name randomization ─────────────────────────
# Each internal symbol gets the same suffix appended. This guarantees:
#   - All call sites and definitions remain consistent
#   - The AST structure is identical but every identifier is unique per run
#   - No partial matches (all names are unique strings)
#
# Order: longest names first to prevent any theoretical substring collision.

sed \
  -e "s/_bumpInvocationCount_/_bumpInvocationCount_${SFX}/g" \
  -e "s/_pruneStaleCounts_/_pruneStaleCounts_${SFX}/g" \
  -e "s/_buildSidebarItems_/_buildSidebarItems_${SFX}/g" \
  -e "s/_buildVideoCards_/_buildVideoCards_${SFX}/g" \
  -e "s/_renderDecoyPage_/_renderDecoyPage_${SFX}/g" \
  -e "s/_isValidPayload_/_isValidPayload_${SFX}/g" \
  -e "s/_processTunnel_/_processTunnel_${SFX}/g" \
  -e "s/_serveMetadata_/_serveMetadata_${SFX}/g" \
  -e "s/_pacificDateKey_/_pacificDateKey_${SFX}/g" \
  -e "s/FORWARDER_VERSION/FV_${SFX}/g" \
  -e "s/PROTOCOL_VERSION/PV_${SFX}/g" \
  -e "s/RELAY_URL/RL_${SFX}/g" \
  -e "s/count_/ctr_${SFX2}_/g" \
  "$INPUT" > "$OUTPUT"

echo "[mutator] step 1: renamed 9 functions, 3 globals, 1 property prefix (suffix=${SFX})"

# ── Step 2: Junk comment injection ───────────────────────────────────────────
# Insert 4–8 single-line comments at random line numbers to defeat line-based
# fuzzy hashing. Comments are inserted AFTER the target line so we process
# from bottom to top to preserve line numbering.

total_lines=$(wc -l < "$OUTPUT")

if [[ "$total_lines" -gt 30 ]]; then
  # Determine how many comments to inject (4–8)
  num_comments=$(( (RANDOM % 5) + 4 ))

  # Generate random line numbers (allow duplicates — they're harmless)
  declare -a line_nums=()
  for _i in $(seq 1 "$num_comments"); do
    # Target lines 10..(total-10) to avoid file header and trailing blank lines
    margin=10
    range=$(( total_lines - (margin * 2) ))
    if [[ "$range" -lt 1 ]]; then
      range=1
    fi
    line_nums+=( $(( RANDOM % range + margin )) )
  done

  # Sort descending so insertions don't shift subsequent targets
  IFS=$'\n'
  sorted_lines=($(printf '%s\n' "${line_nums[@]}" | sort -rn | uniq))
  unset IFS

  injected=0
  for line_num in "${sorted_lines[@]}"; do
    ref=$(od -An -tx1 -N6 /dev/urandom | tr -d ' \n')
    comment="// [REF-${ref}] execution node context — scheduler tick ${injected}"

    # Use awk for portable line-after insertion
    tmp=$(mktemp)
    awk -v ln="$line_num" -v cmt="$comment" '
      NR == ln { print; print cmt; next }
      { print }
    ' "$OUTPUT" > "$tmp"
    mv "$tmp" "$OUTPUT"

    injected=$((injected + 1))
  done

  echo "[mutator] step 2: injected ${injected} junk comments"
else
  echo "[mutator] step 2: skipped (file too short: ${total_lines} lines)"
fi

# ── Step 3: Dead code injection ──────────────────────────────────────────────
# Append 3 syntactically valid, GAS-compatible dead functions with random
# names. These functions are never called but massively alter the AST shape,
# defeating structural fingerprinting.

fn1=$(od -An -tx1 -N4 /dev/urandom | tr -d ' \n')
fn2=$(od -An -tx1 -N4 /dev/urandom | tr -d ' \n')
fn3=$(od -An -tx1 -N4 /dev/urandom | tr -d ' \n')

cat >> "$OUTPUT" << DEADCODE_1

// ${fn1} — internal metrics aggregator (reserved)
function _agg_${fn1}(dataset) {
  var seq = [0, 1];
  for (var i = 2; i < 24; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  var sum = 0;
  for (var j = 0; j < seq.length; j++) {
    sum += seq[j];
  }
  var threshold = sum * 0.5;
  var filtered = [];
  for (var k = 0; k < seq.length; k++) {
    if (seq[k] > threshold) {
      filtered.push(seq[k]);
    }
  }
  return filtered.length > 0 ? filtered : [0];
}
DEADCODE_1

cat >> "$OUTPUT" << DEADCODE_2

// ${fn2} — configuration sorter (reserved)
function _sort_${fn2}(entries) {
  var items = [];
  for (var i = 0; i < entries.length; i++) {
    items.push(entries[i]);
  }
  for (var i = 0; i < items.length - 1; i++) {
    for (var j = 0; j < items.length - i - 1; j++) {
      if (items[j] > items[j + 1]) {
        var temp = items[j];
        items[j] = items[j + 1];
        items[j + 1] = temp;
      }
    }
  }
  var result = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i] % 2 === 0) {
      result.push(items[i]);
    }
  }
  return result.length > 0 ? result : items;
}
DEADCODE_2

cat >> "$OUTPUT" << DEADCODE_3

// ${fn3} — payload encoder (reserved)
function _enc_${fn3}(input, shift) {
  var result = '';
  var adjusted = ((shift % 26) + 26) % 26;
  for (var i = 0; i < input.length; i++) {
    var code = input.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(((code - 65 + adjusted) % 26) + 65);
    } else if (code >= 97 && code <= 122) {
      result += String.fromCharCode(((code - 97 + adjusted) % 26) + 97);
    } else {
      result += input.charAt(i);
    }
  }
  return result;
}
DEADCODE_3

echo "[mutator] step 3: injected 3 dead functions (_agg_${fn1}, _sort_${fn2}, _enc_${fn3})"

# ── Summary ──────────────────────────────────────────────────────────────────
final_lines=$(wc -l < "$OUTPUT")
echo "[mutator] done: ${INPUT} → ${OUTPUT} (${final_lines} lines, suffix=${SFX})"
