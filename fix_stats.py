import re

with open("internal/carrier/stats.go", "r") as f:
    content = f.read()

new_log_stats = """func (c *Client) logStats() {
	c.mu.Lock()
	active := len(c.sessions)
	c.mu.Unlock()

	healthy, total := c.endpointHealthCounts()
	endpointDetail := c.endpointStatsLine()
	accountSummary := c.accountStatsLine()

	log.Printf("[stats] ┌─────────────────────────── STATS ───────────────────────────┐")
	log.Printf("[stats] │ Tunnel State : %-4d Active Sessions │ %d/%d (Open/Closed) │", active, c.stats.sessionsOpen.Load(), c.stats.sessionsClose.Load())
	log.Printf("[stats] │ Traffic Flow : %-4d/%-4d (Frames In/Out) │ %s/%s (Bytes In/Out) │", c.stats.framesIn.Load(), c.stats.framesOut.Load(), humanBytes(c.stats.bytesIn.Load()), humanBytes(c.stats.bytesOut.Load()))
	log.Printf("[stats] │ Net Health   : %-4d/%-4d (Polls OK/Fail) │ %-4d Server RST │ %d/%d (EP OK/Total) │", c.stats.pollsOK.Load(), c.stats.pollsFail.Load(), c.stats.rstFromServer.Load(), healthy, total)
	log.Printf("[stats] ├─────────────────────────────────────────────────────────────┤")
	log.Printf("[stats] │ %s", endpointDetail)
	if accountSummary != "" {
		log.Printf("[stats] │ %s", strings.TrimSpace(accountSummary))
	}
	log.Printf("[stats] └─────────────────────────────────────────────────────────────┘")
}"""

content = re.sub(r"func \(c \*Client\) logStats\(\) \{[\s\S]*?\n\}", new_log_stats, content)

with open("internal/carrier/stats.go", "w") as f:
    f.write(content)
