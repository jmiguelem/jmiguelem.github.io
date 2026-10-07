# Sync Personal Projects

Instructions for the scheduled Claude routine that keeps the **Personal Projects** section of `resume.json` in sync with José Miguel's public GitHub repos. It runs on the 1st of each month. Follow every step in order.

## 1. Find opted-in repos

```sh
curl -s "https://api.github.com/users/jmiguelem/repos?per_page=100&type=owner"
```

A repo is opted in when `private` is false, `fork` is false and `topics` contains `resume`. Use only public data; never include private repos.

## 2. Work out what changed

Managed entries are the items in `personalProjects` (in `resume.json`) that have a `repo` key. Entries without `repo` are hand-written: never touch them.

- Opted-in repo with no managed entry → **add** it.
- Managed entry whose `pushedAt` differs from the repo's `pushed_at` → **update** it. If the entry has `"locked": true`, update only `pushedAt` and leave the text and tags alone.
- Managed entry whose repo is no longer opted in → **remove** it.

If there's nothing to add, update or remove, stop now without a PR.

## 3. Read each repo you add or update

Clone or fetch the repo (public, read-only) and read:

- `README.md`
- dependency files (`requirements.txt`, `pyproject.toml`, `package.json`, `go.mod`, …)
- the top-level layout and the main source files, enough to understand what it does

The `resume` topic is the only thing the owner adds to a repo. Everything else comes from the repo's own content.

## 4. Write the entry

Shape (key order as shown):

```json
{
  "name": "Human-readable title",
  "url": "https://github.com/jmiguelem/<repo>",
  "repo": "jmiguelem/<repo>",
  "pushedAt": "<repo pushed_at, verbatim>",
  "start": "YYYY-MM",
  "summary": "One sentence: what it is and what it does.",
  "bullets": ["2–4 concrete bullets"],
  "tags": ["..."]
}
```

- `start`: month of the repo's `created_at`. No `end` field; the site shows only the start month.
- Writing style: match the existing entries in `resume.json`. Plain, specific, factual; name the actual techniques, numbers and data sources; no hype words ("powerful", "seamless", "cutting-edge"); no first person. Don't claim anything the repo doesn't support.
- `name`: a readable title (e.g. `sleeper-api-analyzer` → "Sleeper API Analyzer").
- Keep the list sorted newest `start` first.

## 5. Tags

- **Always** include `AI` and `Claude` on every personal project.
- Infer the rest from the repo's content: languages (the GitHub `language` field and file types), frameworks and libraries from dependency files and imports, external services and APIs it calls, and one or two broad topics (e.g. `APIs`, `Advanced Analytics`).
- Add another AI tool (e.g. `GitHub Copilot`) only if the repo clearly shows it was used.
- Don't take tags from repo topics; `resume` is the only topic and it is never a tag.
- Use tag names that already exist in `resume.json` → `tags` wherever possible, with the same spelling and case (e.g. a `requirements.txt` with `pytest` → `pytest`).
- Aim for 5–8 tags in total, `AI` and `Claude` included.
- A tag that doesn't exist yet must be added to the `tags` vocabulary with a fitting existing `group` (and a `parent` when there is an obvious one, e.g. a Python library → `Python`). Don't add it to `skills`; note it in the PR so the owner can decide.

## 6. Validate

```sh
python3 - <<'EOF'
import json
d = json.load(open("resume.json"))
vocab = set(d["tags"])
for p in d.get("personalProjects", []):
    missing = [t for t in p.get("tags", []) if t not in vocab]
    assert not missing, (p["name"], missing)
    if "repo" in p and not p.get("locked"):
        assert {"AI", "Claude"} <= set(p["tags"]), (p["name"], "needs AI and Claude")
print("ok")
EOF
```

Keep the file's existing formatting (2-space indent, one tag per line in `tags`, short arrays on one line). Change only what this sync needs.

## 7. Open a pull request

- Branch: `routine/sync-projects-YYYY-MM-DD` (today's UTC date), based on `main`.
- Commit message: `Sync personal projects (YYYY-MM-DD)`.
- PR title: `Sync personal projects — YYYY-MM-DD`. The body lists repos added, updated and removed, and any new tags added to the vocabulary.
- Never push to `main` and never merge the PR. The owner reviews and merges.
