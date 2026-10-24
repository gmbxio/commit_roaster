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

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const FILES = ["index.html", "app.js", "style.css"];

http.createServer((req, res) => {
  if (req.url === "/api/roast") {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      try { req.body = JSON.parse(raw || "{}"); } catch { req.body = {}; }
      res.status = (code) => ((res.statusCode = code), res);
      res.json = (obj) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(obj));
      };
      roast(req, res);
    });
    return;
  }
  const name = req.url === "/" ? "index.html" : req.url.slice(1);
  if (!FILES.includes(name)) { res.statusCode = 404; return res.end("Not found"); }
  res.setHeader("Content-Type", TYPES[path.extname(name)]);
  res.end(fs.readFileSync(path.join(__dirname, name)));
}).listen(3000, () => console.log("Open http://localhost:3000"));