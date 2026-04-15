// Vercel catch-all: handles /api/* → Express app
// api/[...slug].js matches /api AND all sub-paths (per Vercel docs)
const app = require("../backend/server");

module.exports = (req, res) => {
  // Restore /api prefix if Vercel strips it for the catch-all route
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }
  return app(req, res);
};
