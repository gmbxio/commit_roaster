# Commit Roaster
Enter a GitHub username, pick a repo, get every commit message roasted by Gemini.

- Frontend: plain HTML/CSS/JS. It calls the GitHub API straight from the browser.
- Backend: Vercel-compatible API routes, GitHub OAuth, Neon PostgreSQL, and Drizzle ORM.
- Anonymous users can roast public repositories. GitHub sign-in is optional and saves roast history.
- Local development: install dependencies with `npm install`, configure `.env.local`, then run `npm run dev` with Node 20.6+.
- Database: run the generated SQL in `drizzle/` against Neon, or use `npx drizzle-kit push` with `DATABASE_URL` set.
- Required environment variables:
  - `GEMINI_API_KEY`
  - `DATABASE_URL`
  - `SESSION_SECRET` (a long random value)
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/callback`
- Deploy: configure the same variables in Vercel. Set `GITHUB_CALLBACK_URL` to the production callback URL.
