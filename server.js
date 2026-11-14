const http = require("http");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env.local");
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const roast = require("./api/roast.js");
const apiRoutes = {
  "/api/roast": roast,
  "/api/history": require("./api/history.js"),
  "/api/auth/login": require("./api/auth/login.js"),
  "/api/auth/callback": require("./api/auth/callback.js"),
  "/api/auth/me": require("./api/auth/me.js"),
  "/api/auth/logout": require("./api/auth/logout.js"),
};

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const FILES = ["index.html", "app.js", "style.css", "mixpanel.min.js"];

http.createServer((req, res) => {
  const route = new URL(req.url, "http://localhost").pathname;
  if (apiRoutes[route]) {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      try { req.body = JSON.parse(raw || "{}"); } catch { req.body = {}; }
      res.status = (code) => ((res.statusCode = code), res);
      res.json = (obj) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(obj));
      };
      Promise.resolve(apiRoutes[route](req, res)).catch((error) => {
        console.error("API request failed:", error);
        if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
      });
    });
    return;
  }
  const name = req.url === "/" ? "index.html" : req.url.slice(1);
  if (!FILES.includes(name)) { res.statusCode = 404; return res.end("Not found"); }
  res.setHeader("Content-Type", TYPES[path.extname(name)]);
  res.end(fs.readFileSync(path.join(__dirname, name)));
}).listen(3000, () => console.log("Open http://localhost:3000"));