const { readSession } = require("../../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  const session = await readSession(req);
  res.status(200).json({ user: session ? { username: session.username } : null });
};
