# jmiguelem.github.io

Online resume of José Miguel Elizalde Moncayo, served by GitHub Pages at https://jmiguelem.github.io/.

## Updating the resume

All content lives in `resume.json`. Edit that file only.

- **work**: newest first is automatic (sorted by `start`). Client projects go in an employer's `projects` list.
- **education**, **learning** (courses and certifications): the Learning section stays hidden while its list is empty.
- **skills**: groups of tag names shown in the Skills section.
- **tags**: the tag vocabulary. Every tag used anywhere must be defined here with a `group`; an optional `parent` makes it roll up (for example BigQuery has parent GCP, so filtering by GCP includes BigQuery entries).

Dates use `YYYY-MM`; `"end": null` means Present.

Learning entry example:

```json
{ "name": "Professional Data Engineer", "issuer": "Google Cloud", "date": "2026-01",
  "url": "https://example.com/credential", "tags": ["GCP", "BigQuery"] }
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page skeleton and meta tags |
| `resume.json` | All content and tags |
| `styles.css` | Layout, dark mode, print styles |
| `app.js` | Renders the JSON, tag filtering, `?tags=` links, structured data |
| `favicon.svg` | Tab icon |

## Preview locally

```sh
python3 -m http.server
```

Then open http://localhost:8000 (opening `index.html` directly won't load `resume.json`).

## Filter links

`https://jmiguelem.github.io/?tags=GCP` opens the page filtered to GCP. Several tags: `?tags=GCP,DBT` (matches any of them).
