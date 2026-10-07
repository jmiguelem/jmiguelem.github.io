# jmiguelem.github.io

Online resume of José Miguel Elizalde Moncayo, served by GitHub Pages at https://jmiguelem.github.io/.

## Updating the resume

All content lives in `resume.json`. Edit that file only.

- **work**: newest first is automatic (sorted by `start`). Client projects go in an employer's `projects` list.
- **personalProjects**: side projects (`name`, `url`, `start`, `summary`, `bullets`, `tags`); only the start month is shown; the section stays hidden while the list is empty.
  Repos are synced automatically, see [Personal Projects sync](#personal-projects-sync).
- **education**, **learning** (courses and certifications): the Learning section stays hidden while its list is empty.
- **skills**: groups of tag names shown in the Skills section.
- **tags**: the tag vocabulary. Every tag used anywhere must be defined here with a `group`; an optional `parent` makes it roll up (for example BigQuery has parent GCP, so filtering by GCP includes BigQuery entries).

Dates use `YYYY-MM`; `"end": null` means Present.

Learning entry example:

```json
{ "name": "Professional Data Engineer", "issuer": "Google Cloud", "date": "2026-01",
  "url": "https://example.com/credential", "tags": ["GCP", "BigQuery"] }
```

## Personal Projects sync

A scheduled Claude routine keeps `personalProjects` in sync with my public GitHub repos. It runs on the 1st of each month at 09:00 Monterrey time (15:00 UTC) and opens a pull request when something changed. Its instructions are in [`.github/sync-personal-projects.md`](.github/sync-personal-projects.md).

- **Opt a repo in**: add the topic `resume` to it (repo page → About → ⚙). It must be public and not a fork. Remove the topic to drop it on the next run.
- **Content and tags**: nothing else is added to the repo. Claude writes the summary and bullets from the README and code. Every entry gets the `AI` and `Claude` tags; the rest are inferred from languages, dependencies and services used.
- **Synced entries** carry `repo` and `pushedAt`. An entry is rewritten only when the repo has new pushes since `pushedAt`.
- **Keep your own wording**: add `"locked": true` to an entry and the routine stops rewriting it (it's still removed if the topic goes away).
- Entries without a `repo` key are manual and never touched.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page skeleton and meta tags |
| `resume.json` | All content and tags |
| `styles.css` | Layout, dark mode, print styles |
| `app.js` | Renders the JSON, tag filtering, `?tags=` links, structured data |
| `favicon.svg` | Tab icon |
| `.github/sync-personal-projects.md` | Instructions for the Personal Projects sync routine |

## Preview locally

```sh
python3 -m http.server
```

Then open http://localhost:8000 (opening `index.html` directly won't load `resume.json`).

## Filter links

`https://jmiguelem.github.io/?tags=GCP` opens the page filtered to GCP. Several tags: `?tags=GCP,DBT` (matches any of them).
