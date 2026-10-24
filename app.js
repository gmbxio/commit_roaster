const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;       // textContent only: commit messages are untrusted
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

$("go").onclick = async () => {
  const user = $("user").value.trim();
  if (!user) return;
  $("out").replaceChildren();
  $("repos").textContent = "Loading repos...";
  try {
    const all = await gh(`/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`);
    const repos = all.filter((r) => !r.fork); // forks hold other people's commits
    $("repos").replaceChildren();
    if (!repos.length) { $("repos").textContent = "No original public repos."; return; }
    for (const repo of repos) {
      const b = el("button", repo.name);
      b.onclick = () => roast(user, repo.name);
      $("repos").append(b);
    }
  } catch (e) { $("repos").textContent = e.message; }
};
$("user").onkeydown = (e) => { if (e.key === "Enter") $("go").click(); };

async function roast(user, repo) {
  $("out").replaceChildren(el("p", "Reading the crime scene..."));
  try {
    const raw = await gh(`/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/commits?per_page=15`);
    const list = raw.map((c) => ({ sha: c.sha.slice(0, 7), message: c.commit.message.split("\n")[0] }));

    // No database: remember earlier roasts in this browser so the LLM can avoid repeating them
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
  } catch (e) { $("out").replaceChildren(el("p", e.message)); }
}