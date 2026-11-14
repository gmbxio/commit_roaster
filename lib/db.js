const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");

let database;

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("Server missing DATABASE_URL");
  if (!database) database = drizzle(neon(process.env.DATABASE_URL));
  return database;
}

module.exports = { getDb };
