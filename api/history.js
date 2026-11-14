const { desc, eq } = require("drizzle-orm");
const { getDb } = require("../lib/db");
const { users, roasts } = require("../db/schema");
const { readSession } = require("../lib/session");

module.exports = async (req, res) => {
  const session = await readSession(req);
  if (!session) return res.status(401).json({ error: "Sign in to use roast history." });

  try {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.githubId, session.githubId)).limit(1);
    if (!user) return res.status(401).json({ error: "Session expired. Sign in again." });

    if (req.method === "GET") {
      const history = await db.select({
        id: roasts.id,
        repository: roasts.repository,
        result: roasts.result,
        createdAt: roasts.createdAt,
      }).from(roasts).where(eq(roasts.userId, user.id)).orderBy(desc(roasts.createdAt)).limit(20);
      return res.status(200).json({ history });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      if (!body.repository || !Array.isArray(body.commits) || !Array.isArray(body.roasts)) {
        return res.status(400).json({ error: "Invalid roast history payload." });
      }
      await db.insert(roasts).values({
        userId: user.id,
        repository: String(body.repository).slice(0, 200),
        commits: JSON.stringify(body.commits).slice(0, 12000),
        result: JSON.stringify(body.roasts).slice(0, 20000),
      });
      return res.status(201).json({ saved: true });
    }

    return res.status(405).json({ error: "GET or POST only" });
  } catch (error) {
    console.error("History request failed:", error);
    return res.status(500).json({ error: "Could not access roast history." });
  }
};
