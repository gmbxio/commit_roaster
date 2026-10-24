# Commit Roaster
Enter a GitHub username, pick a repo, get every commit message roasted by Gemini.

- Frontend: plain HTML/CSS/JS. It calls the GitHub API straight from the browser.
- Backend: one serverless function (`api/roast.js`) that holds the Gemini key.
- Local development: put `GEMINI_API_KEY=...` in `.env.local` and run `node server.js` with Node 20.6+.
- Deploy: Vercel, with env var `GEMINI_API_KEY` (optional: `GEMINI_MODEL`, for example `gemini-3.8-flash` or `models/gemini-3.8-flash`).
