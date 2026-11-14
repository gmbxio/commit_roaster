const path = require("path");

if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile(path.join(__dirname, ".env.local")); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

module.exports = {
  schema: path.join(__dirname, "db/schema.js"),
  out: path.join(__dirname, "drizzle"),
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
};
