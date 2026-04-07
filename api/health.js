// Standalone health check — no Express, no bundling, no dependencies.
// If /api/health returns JSON, the Vercel function runtime is working.
module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, ts: Date.now(), url: req.url }));
};
