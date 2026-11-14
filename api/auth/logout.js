const { clearSession } = require("../../lib/session");

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  clearSession(res);
  res.status(200).json({ ok: true });
};
