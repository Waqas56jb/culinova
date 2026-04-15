// Vercel catch-all: handles /api, /api/chat/message, /api/admin/login, etc.
// File must be at repo root: api/[...slug].js
const app = require("../backend/server");

module.exports = (req, res) => {
  // Ensure Express sees the full /api/... path
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }
  return app(req, res);
};
