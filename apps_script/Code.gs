// StreamVid — Video Streaming Platform
// Frontend renderer and API gateway.
// Deploy as: Execute as: Me, Access: Anyone.

var RELAY_URL = 'http://YOUR.VPS.IP:8443/tunnel';
var FORWARDER_VERSION = 1;
var PROTOCOL_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// POST handler — processes inbound requests.
// All exceptions are caught; errors never surface to platform scanners.
// ─────────────────────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var payload = (e && e.postData && e.postData.contents) || '';
    if (!_isValidPayload_(payload)) {
      return _renderDecoyPage_();
    }
    return _processTunnel_(payload);
  } catch (err) {
    return _renderDecoyPage_();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET handler — serves the public frontend or metadata API.
// ─────────────────────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.legacy === '1') {
      return ContentService
        .createTextOutput('GooseRelay forwarder OK')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    if (e && e.parameter && e.parameter.meta === '1') {
      return _serveMetadata_();
    }
    return _renderDecoyPage_();
  } catch (err) {
    return _renderDecoyPage_();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Decoy: renders a visually complete HTML5 video streaming page.
// Served for all public GET requests and for any POST that fails validation.
// ─────────────────────────────────────────────────────────────────────────────
function _renderDecoyPage_() {
  var cards = _buildVideoCards_();
  var sidebar = _buildSidebarItems_();
  var h = [];

  h.push('<!DOCTYPE html>');
  h.push('<html lang="en"><head><meta charset="UTF-8">');
  h.push('<meta name="viewport" content="width=device-width,initial-scale=1.0">');
  h.push('<title>StreamVid \u2014 Watch Together</title>');
  h.push('<style>');
  h.push('*{margin:0;padding:0;box-sizing:border-box}');
  h.push('body{font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;');
  h.push('background:#0f0f0f;color:#e0e0e0;overflow-x:hidden}');
  h.push('.header{background:#1a1a1a;padding:12px 24px;display:flex;');
  h.push('align-items:center;gap:16px;position:sticky;top:0;z-index:100}');
  h.push('.logo{color:#ff0000;font-size:22px;font-weight:700;letter-spacing:-0.5px}');
  h.push('.logo span{color:#aaa;font-weight:400;font-size:13px;margin-left:8px}');
  h.push('.search{flex:1;max-width:520px;margin:0 auto;position:relative}');
  h.push('.search input{width:100%;padding:8px 16px;background:#121212;');
  h.push('border:1px solid #333;border-radius:20px;color:#e0e0e0;font-size:14px;outline:none}');
  h.push('.search input::placeholder{color:#666}');
  h.push('.user-icon{width:32px;height:32px;border-radius:50%;background:#444;');
  h.push('display:flex;align-items:center;justify-content:center;font-size:14px;color:#bbb}');
  h.push('.pills{padding:12px 24px;display:flex;gap:8px;overflow-x:auto;background:#0f0f0f}');
  h.push('.pills span{padding:6px 14px;background:#272727;border-radius:8px;');
  h.push('font-size:13px;white-space:nowrap;cursor:pointer;transition:background .2s}');
  h.push('.pills span:hover{background:#3a3a3a}');
  h.push('.pills span.active{background:#e0e0e0;color:#0f0f0f;font-weight:500}');
  h.push('.main{display:flex;padding:0 24px 24px;gap:24px}');
  h.push('.grid{flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}');
  h.push('.card{background:#1a1a1a;border-radius:12px;overflow:hidden;');
  h.push('cursor:pointer;transition:transform .15s,box-shadow .15s}');
  h.push('.card:hover{transform:scale(1.02);box-shadow:0 4px 20px rgba(0,0,0,0.4)}');
  h.push('.card .thumb{width:100%;aspect-ratio:16/9;position:relative}');
  h.push('.card .thumb::after{content:"\\25B6";position:absolute;top:50%;left:50%;');
  h.push('transform:translate(-50%,-50%);font-size:32px;color:rgba(255,255,255,0.75);');
  h.push('opacity:0;transition:opacity .2s}');
  h.push('.card:hover .thumb::after{opacity:1}');
  h.push('.card .info{padding:12px}');
  h.push('.card .info h3{font-size:14px;font-weight:500;line-height:1.3;');
  h.push('margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;');
  h.push('-webkit-box-orient:vertical;overflow:hidden}');
  h.push('.card .info .channel{font-size:12px;color:#aaa;margin-bottom:2px}');
  h.push('.card .info .meta{font-size:12px;color:#888}');
  h.push('.sidebar{width:320px;flex-shrink:0}');
  h.push('.sidebar h2{font-size:16px;font-weight:500;margin-bottom:12px;color:#e0e0e0}');
  h.push('.side-item{display:flex;gap:8px;margin-bottom:12px;cursor:pointer;');
  h.push('padding:4px;border-radius:8px;transition:background .15s}');
  h.push('.side-item:hover{background:#272727}');
  h.push('.mini-thumb{width:168px;height:94px;border-radius:6px;flex-shrink:0}');
  h.push('.side-meta{display:flex;flex-direction:column;justify-content:center}');
  h.push('.side-title{font-size:13px;line-height:1.3;margin-bottom:4px;');
  h.push('display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}');
  h.push('.side-views{font-size:12px;color:#888}');
  h.push('.footer{padding:24px;text-align:center;color:#555;font-size:12px;');
  h.push('border-top:1px solid #222;margin-top:24px}');
  h.push('.footer a{color:#888;text-decoration:none;margin:0 8px}');
  h.push('.footer a:hover{text-decoration:underline}');
  h.push('</style></head><body>');

  // Header
  h.push('<div class="header">');
  h.push('<div class="logo">StreamVid<span>Watch Together</span></div>');
  h.push('<div class="search"><input type="text" placeholder="Search videos..."></div>');
  h.push('<div class="user-icon">\u2630</div>');
  h.push('</div>');

  // Category pills
  h.push('<div class="pills">');
  h.push('<span class="active">Trending</span>');
  h.push('<span>Music</span><span>Gaming</span><span>News</span>');
  h.push('<span>Sports</span><span>Learning</span><span>Fashion</span>');
  h.push('<span>Podcasts</span><span>Recently Uploaded</span>');
  h.push('</div>');

  // Main layout: grid + sidebar
  h.push('<div class="main">');
  h.push('<div class="grid">');
  h.push(cards);
  h.push('</div>');
  h.push('<div class="sidebar">');
  h.push('<h2>Up Next</h2>');
  h.push(sidebar);
  h.push('</div>');
  h.push('</div>');

  // Footer
  h.push('<div class="footer">');
  h.push('<a href="#">About</a><a href="#">Terms</a>');
  h.push('<a href="#">Privacy</a><a href="#">Help</a>');
  h.push('<br>\u00A9 2026 StreamVid');
  h.push('</div>');

  // Inline JS for interactivity
  h.push('<script>');
  h.push('document.querySelectorAll(".card").forEach(function(c){');
  h.push('c.addEventListener("click",function(){');
  h.push('c.style.transform="scale(0.97)";');
  h.push('setTimeout(function(){c.style.transform=""},200)});');
  h.push('c.addEventListener("mouseenter",function(){');
  h.push('var t=c.querySelector(".thumb");if(t)t.style.filter="brightness(1.1)"});');
  h.push('c.addEventListener("mouseleave",function(){');
  h.push('var t=c.querySelector(".thumb");if(t)t.style.filter=""})});');
  h.push('document.querySelectorAll(".pills span").forEach(function(p){');
  h.push('p.addEventListener("click",function(){');
  h.push('document.querySelectorAll(".pills span").forEach(function(s){');
  h.push('s.classList.remove("active")});');
  h.push('p.classList.add("active")})});');
  h.push('</script></body></html>');

  return HtmlService.createHtmlOutput(h.join(''))
    .setTitle('StreamVid — Watch Together')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─────────────────────────────────────────────────────────────────────────────
// Decoy helpers: build video card and sidebar HTML fragments.
// ─────────────────────────────────────────────────────────────────────────────
function _buildVideoCards_() {
  var titles = [
    'Funny Cat Compilation 2026 \u2014 Best Moments',
    'Golden Retriever Puppies First Swim',
    'Kitten vs Laser Pointer \u2014 Ultimate Edition',
    'Dog Goes to Park \u2014 Daily Vlog #247',
    'Cat Falls Asleep in Weird Position',
    'Bunny Eating Carrot \u2014 ASMR Relaxation',
    'Parrot Dancing to Pop Music \u2014 Viral Hit',
    'Hamster Wheel Marathon \u2014 Full Speed Run',
    'Turtle Race Championship Finals 2026',
    'Puppy Meets Baby \u2014 Adorable First Meeting',
    'Cat vs Cucumber Compilation #52',
    'Dog Howls Along to Music \u2014 Hilarious'
  ];
  var channels = [
    'PetWorld', 'AnimalFun', 'CatLovers', 'DogDaily',
    'CutePets', 'WildLife', 'PetWorld', 'AnimalFun',
    'CatLovers', 'DogDaily', 'CutePets', 'WildLife'
  ];
  var views = [
    '1.2M views', '845K views', '2.1M views', '567K views',
    '3.4M views', '4.2M views', '923K views', '1.8M views',
    '2.7M views', '412K views', '1.5M views', '3.1M views'
  ];
  var times = [
    '2 days ago', '1 week ago', '3 months ago', '5 hours ago',
    '1 month ago', '2 weeks ago', '6 days ago', '4 months ago',
    '3 days ago', '8 hours ago', '2 months ago', '1 year ago'
  ];
  var gradients = [
    'linear-gradient(135deg,#4a90d9,#d94a4a)',
    'linear-gradient(135deg,#4ad97a,#d9c74a)',
    'linear-gradient(135deg,#d94a8c,#4a7ad9)',
    'linear-gradient(135deg,#9b4ad9,#4ad9c7)',
    'linear-gradient(135deg,#d9a04a,#4a5ed9)',
    'linear-gradient(135deg,#4ad9d9,#d94ab8)'
  ];
  var html = '';
  for (var i = 0; i < titles.length; i++) {
    html += '<div class="card">'
      + '<div class="thumb" style="background:' + gradients[i % gradients.length] + '"></div>'
      + '<div class="info">'
      + '<h3>' + titles[i] + '</h3>'
      + '<p class="channel">' + channels[i] + '</p>'
      + '<p class="meta">' + views[i] + ' \u2022 ' + times[i] + '</p>'
      + '</div></div>';
  }
  return html;
}

function _buildSidebarItems_() {
  var items = [
    'Cat Falls Asleep Standing Up',
    'Dog Howls Along to Music Remix',
    'Kitten Meets Mirror for First Time',
    'Parrot Says Hello to Everyone',
    'Bunny Jump Compilation \u2014 Best Of',
    'Puppy Learns to Fetch a Ball'
  ];
  var views = [
    '420K views', '1.1M views', '780K views',
    '340K views', '920K views', '560K views'
  ];
  var grads = [
    'linear-gradient(135deg,#3a3a3a,#555)',
    'linear-gradient(135deg,#444,#3a5a3a)',
    'linear-gradient(135deg,#5a3a3a,#3a3a5a)',
    'linear-gradient(135deg,#3a5a5a,#5a5a3a)',
    'linear-gradient(135deg,#4a3a5a,#3a5a4a)',
    'linear-gradient(135deg,#5a4a3a,#3a3a4a)'
  ];
  var html = '';
  for (var i = 0; i < items.length; i++) {
    html += '<div class="side-item">'
      + '<div class="mini-thumb" style="background:' + grads[i % grads.length] + '"></div>'
      + '<div class="side-meta">'
      + '<p class="side-title">' + items[i] + '</p>'
      + '<p class="side-views">' + views[i] + '</p>'
      + '</div></div>';
  }
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload validation: rejects anything that is not a valid base64-encoded
// AES-GCM batch. Minimum size = 12 (nonce) + 16 (tag) = 28 bytes raw,
// which base64-encodes to >= 40 chars of pure [A-Za-z0-9+/=].
// ─────────────────────────────────────────────────────────────────────────────
function _isValidPayload_(payload) {
  if (!payload || payload.length < 40) {
    return false;
  }
  for (var i = 0; i < payload.length; i++) {
    var c = payload.charCodeAt(i);
    if (c >= 65 && c <= 90) continue;   // A-Z
    if (c >= 97 && c <= 122) continue;  // a-z
    if (c >= 48 && c <= 57) continue;   // 0-9
    if (c === 43 || c === 47 || c === 61) continue;  // + / =
    if (c === 10 || c === 13) continue; // \n \r
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tunnel processor: forwards validated payloads to the relay server.
// On ANY failure (network, HTTP error, HTML response), returns the decoy.
// ─────────────────────────────────────────────────────────────────────────────
function _processTunnel_(payload) {
  try {
    _bumpInvocationCount_();
    var resp = UrlFetchApp.fetch(RELAY_URL, {
      method: 'post',
      contentType: 'text/plain',
      payload: payload,
      muteHttpExceptions: true,
      followRedirects: false,
      deadline: 30
    });
    var code = resp.getResponseCode();
    var body = resp.getContentText();

    // Any HTTP error → decoy
    if (code >= 400) {
      return _renderDecoyPage_();
    }

    // HTML response from a dead proxy or error page → decoy
    if (body.length > 0 && (
      body.indexOf('<!') === 0 ||
      body.indexOf('<html') === 0 ||
      body.indexOf('<HTML') === 0)) {
      return _renderDecoyPage_();
    }

    return ContentService
      .createTextOutput(body)
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return _renderDecoyPage_();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata endpoint: returns per-deployment invocation stats as JSON.
// Only served when ?meta=1 is present; otherwise the decoy page is shown.
// ─────────────────────────────────────────────────────────────────────────────
function _serveMetadata_() {
  try {
    var props = PropertiesService.getScriptProperties();
    var today = _pacificDateKey_();
    var count = parseInt(props.getProperty('count_' + today) || '0', 10);
    var out = {
      ok: true,
      date: today,
      count: count,
      version: FORWARDER_VERSION,
      protocol: PROTOCOL_VERSION
    };
    return ContentService
      .createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return _renderDecoyPage_();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: date key in Pacific time (matches Apps Script quota window).
// ─────────────────────────────────────────────────────────────────────────────
function _pacificDateKey_() {
  return Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: best-effort per-day invocation counter.
// Under high concurrency, slight under-counting is acceptable.
// LockService is deliberately avoided — it adds tens of ms per request.
// ─────────────────────────────────────────────────────────────────────────────
function _bumpInvocationCount_() {
  try {
    var props = PropertiesService.getScriptProperties();
    var today = _pacificDateKey_();
    var key = 'count_' + today;
    var raw = props.getProperty(key);
    if (raw === null) {
      _pruneStaleCounts_(props, today);
    }
    var cur = raw === null ? 0 : parseInt(raw, 10);
    props.setProperty(key, String(cur + 1));
  } catch (err) {
    // Informational counter — never break the request.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: purge yesterday's property keys to prevent unbounded growth.
// Google caps PropertiesService at ~9 KB / 500 entries.
// ─────────────────────────────────────────────────────────────────────────────
function _pruneStaleCounts_(props, today) {
  var keys = props.getKeys();
  var keep = 'count_' + today;
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k.indexOf('count_') === 0 && k !== keep) {
      props.deleteProperty(k);
    }
  }
}
