// ─── Mixpanel bootstrap ────────────────────────────────────────────────────
// Token is public (client-side); it only lets you *send* events to your project.
// Replace with your own token from mixpanel.com → Project Settings → Token.
const MIXPANEL_TOKEN = "d2a6fa9b4e8dedda02290267f18d41f1";

mixpanel.init(MIXPANEL_TOKEN, {
  persistence: "localStorage",   // keeps distinct_id stable across page loads
  track_pageview: false,         // we fire page_viewed manually so the name matches our funnel exactly
  ignore_dnt: false,
});

// Helper — fire an event and silently swallow errors so analytics never breaks the app
function track(event, props) {
  try { mixpanel.track(event, props || {}); } catch (_) {}
}

// ─── Funnel step 0 — page_viewed ──────────────────────────────────────────
// Fires as soon as the script loads (i.e. user opened the app).
track("page_viewed", {
  referrer: document.referrer || null,
  url: location.href,
});

// ─── Timing helpers ────────────────────────────────────────────────────────
let repoSearchStart   = null;
let roastRequestStart = null;

// ─── DOM helpers ───────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text; // textContent only: commit messages are untrusted
  if (cls) e.className = cls;
  return e;
};

async function gh(path) {
  const r = await fetch("https://api.github.com" + path);
  if (r.status === 403 || r.status === 429) throw new Error("GitHub rate limit hit. Wait a while and retry.");
  if (r.status === 404) throw new Error("User or repo not found.");
  if (r.status === 409) throw new Error("This repo is empty.");
  if (!r.ok) throw new Error("GitHub error " + r.status);
  return r.json();
}

// ─── Funnel step 1 — username_submitted ───────────────────────────────────
$("go").onclick = async () => {
  const user = $("user").value.trim();
  if (!user) return;

  repoSearchStart = Date.now();

  // Core funnel event: user entered a username and hit "Find repos"
  track("username_submitted", { github_username: user });

  $("out").replaceChildren();
  $("repos").textContent = "Loading repos...";

  try {
    const all = await gh(`/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`);
    const repos = all.filter((r) => !r.fork);
    const durationMs = Date.now() - repoSearchStart;

    if (!repos.length) {
      $("repos").textContent = "No original public repos.";
      // Dead-end: user dropped off because they have no original repos
      track("repos_loaded", {
        github_username: user,
        repo_count: 0,
        duration_ms: durationMs,
        outcome: "empty",
      });
      return;
    }

    // Supporting event (outside funnel): useful for diagnosing lookup failures vs. abandonment
    track("repos_loaded", {
      github_username: user,
      repo_count: repos.length,
      duration_ms: durationMs,
      outcome: "success",
    });

    $("repos").replaceChildren();
    for (const repo of repos) {
      const b = el("button", repo.name);
      b.onclick = () => roast(user, repo.name, repo);
      $("repos").append(b);
    }
  } catch (e) {
    const durationMs = Date.now() - repoSearchStart;
    // Supporting event: username lookup errored (rate limit, 404, etc.)
    track("repos_loaded", {
      github_username: user,
      repo_count: null,
      duration_ms: durationMs,
      outcome: "error",
      error: e.message,
    });
    $("repos").textContent = e.message;
  }
};
$("user").onkeydown = (e) => { if (e.key === "Enter") $("go").click(); };

// ─── Funnel step 2 — repo_selected ────────────────────────────────────────
async function roast(user, repo, repoMeta) {
  const username = $("user").value.trim();

  // Core funnel event: user clicked a specific repo
  track("repo_selected", {
    github_username: username,
    repo_name: repo,
    repo_language: repoMeta?.language || null,
    repo_stars: repoMeta?.stargazers_count ?? null,
  });

  $("out").replaceChildren(el("p", "Reading the crime scene..."));
  roastRequestStart = Date.now();

  try {
    const raw = await gh(`/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/commits?per_page=15`);
    const list = raw.map((c) => ({ sha: c.sha.slice(0, 7), message: c.commit.message.split("\n")[0] }));

    const key = `roasts:${user}/${repo}`;
    let previous = [];
    try { previous = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}

    const r = await fetch("/api/roast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commits: list, previous }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Roast failed. Try again.");

    const durationMs = Date.now() - roastRequestStart;

    // ─── Funnel step 3 — roast_generated ──────────────────────────────────
    // This is the money event. Every property here feeds a résumé number.
    track("roast_generated", {
      github_username: username,
      repo_name: repo,
      commit_count: list.length,
      roast_count: data.roasts?.length ?? 0,
      persona: data.persona,
      duration_ms: durationMs,                 // → median response time
      is_repeat_roast: previous.length > 0,
    });

    const bySha = Object.fromEntries(data.roasts.map((x) => [x.sha, x.roast]));
    $("out").replaceChildren(el("h2", `Roasted by: ${data.persona}`));
    for (const c of list) {
      const box = el("div", "", "commit");
      box.append(el("code", `${c.sha}  ${c.message}`), el("p", bySha[c.sha] || "(too boring to roast)"));
      $("out").append(box);
    }

    try {
      localStorage.setItem(key, JSON.stringify([...previous, ...data.roasts.map((x) => x.roast)].slice(-40)));
    } catch {}

  } catch (e) {
    const durationMs = roastRequestStart ? Date.now() - roastRequestStart : null;
    // Supporting event: roast failed — which step caused the most pain?
    track("roast_failed", {
      github_username: username,
      repo_name: repo,
      error: e.message,
      duration_ms: durationMs,
    });
    $("out").replaceChildren(el("p", e.message));
  }
}
