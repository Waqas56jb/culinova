// Vercel catch-all: routes /api, /api/chat/message, /api/admin/* etc. → Express
const app = require("../backend/server");

module.exports = (req, res) => {
  /**
   * Vercel serverless pre-parses req.body from the raw stream before handing
   * the request to our handler. If we let express.json() (body-parser) run
   * again, it tries to re-read an already-consumed stream which causes
   * "Maximum call stack size exceeded" on POST requests with JSON bodies.
   *
   * Setting req._body = true is the body-parser convention to signal
   * "body already parsed — skip me". req.body will already be the correct
   * JS object set by Vercel's runtime.
   */
  if (req.body !== undefined) {
    req._body = true;
  }

  // Vercel may strip /api prefix for catch-all routes — restore it so Express
  // can match routes like app.post("/api/chat/message")
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }

  return app(req, res);
};
