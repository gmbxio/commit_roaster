const { SignJWT, jwtVerify } = require("jose");

const COOKIE_NAME = "commit_roaster_session";

function getSecret() {
  if (!process.env.SESSION_SECRET) throw new Error("Server missing SESSION_SECRET");
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

async function createSession(user) {
  return new SignJWT({ githubId: user.githubId, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

async function readSession(req) {
  const raw = req.headers.cookie || "";
  const value = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.split("=")[1];
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(decodeURIComponent(value), getSecret());
    return payload;
  } catch {
    return null;
  }
}

function setSession(res, token) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

module.exports = { createSession, readSession, setSession, clearSession };
