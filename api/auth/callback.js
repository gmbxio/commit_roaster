const { getDb } = require("../../lib/db");
const { users } = require("../../db/schema");
const { createSession, setSession } = require("../../lib/session");
const { eq } = require("drizzle-orm");

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  const code = new URL(req.url, "http://localhost").searchParams.get("code");
  if (!code) return res.status(400).json({ error: "Missing GitHub authorization code" });

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
    });
    const token = await tokenResponse.json();
    if (!token.access_token) throw new Error(token.error_description || "GitHub token exchange failed");

    const profileResponse = await fetch("https://api.github.com/user", {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token.access_token}` },
    });
    if (!profileResponse.ok) throw new Error("Could not load GitHub profile");
    const profile = await profileResponse.json();

    const db = getDb();
    const [user] = await db.insert(users).values({
      githubId: String(profile.id),
      username: profile.login,
      avatarUrl: profile.avatar_url || null,
    }).onConflictDoUpdate({
      target: users.githubId,
      set: { username: profile.login, avatarUrl: profile.avatar_url || null },
    }).returning();

    setSession(res, await createSession(user));
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
  } catch (error) {
    console.error("GitHub OAuth failed:", error);
    res.status(502).json({ error: "GitHub sign-in failed. Please try again." });
  }
};
