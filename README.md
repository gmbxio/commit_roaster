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

## Mixpanel funnel

The frontend already tracks the required funnel:

```text
page_viewed → username_submitted → repo_selected → roast_generated
```

In Mixpanel, create a Funnel report using those four events in that order. Use
`github_username` and `repo_name` as breakdown properties, and use
`duration_ms` from `roast_generated` to calculate response time. The app also
tracks `roast_failed`, `user_signed_in`, and `roast_saved` for diagnosis.

Do not claim fixed numbers such as 40 users, 62% completion, or 8 seconds
unless your own Mixpanel, Vercel, or usability-test data supports them. Record
the actual unique users, funnel conversion rates, and median response duration.
