/**
 * Vercel Serverless Entry Point
 *
 * Vercel auto-detects files in the /api folder and routes:
 *   /api/*  →  api/index.js
 * But strips the /api prefix before passing req.url to Express.
 * We restore it so all existing routes (/api/chat/message etc.) still match.
 */

const app = require("../server");

module.exports = (req, res) => {
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url === "/" ? "" : req.url);
  }
  return app(req, res);
};
