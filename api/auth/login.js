module.exports = (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  if (!process.env.GITHUB_CLIENT_ID) return res.status(500).json({ error: "Server missing GITHUB_CLIENT_ID" });
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL || `${process.env.APP_URL}/api/auth/callback`,
    scope: "read:user",
  });
  res.statusCode = 302;
  res.setHeader("Location", `https://github.com/login/oauth/authorize?${params}`);
  res.end();
};
