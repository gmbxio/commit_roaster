const { clearSession } = require("../../lib/session");

module.exports = (req, res) => {
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "GET or POST only" });
  clearSession(res);
  if (req.method === "GET") {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    return res.end();
  }
  res.status(200).json({ ok: true });
};
