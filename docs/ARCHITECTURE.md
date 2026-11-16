# VisaPulse — Architecture (rewritten 2026-11-16; decisions in DECISIONS.md D16–D30)

## What it is
A static website generated at build time from a verified dataset of U.S. Visa Bulletin cutoff dates
(2002 → now), plus a rule-based Green Card Planner. No backend. Output is plain HTML/CSS and a few kB of JS.

## Pipeline
```
official page (travel.state.gov)
   │  read via Internet Archive snapshot, original bytes         scripts/fetch-archive.mjs
   ▼
.cache/official/YYYY-MM.html  +  data/sources/manifest.json (snapshot timestamp, SHA-256)
   │  parse, fail loudly on anything unknown                     src/lib/parseBulletin.js, scripts/build-data.mjs
   ▼
data/bulletins/YYYY/YYYY-MM.json  (schema v2, provenance per file)
   │  validate + cross-check against legacy                      src/lib/validateBulletin.js, scripts/validate-data.mjs
   ▼
dataset layer (official first, legacy only as labeled fallback)  src/lib/dataset.js
   ▼
page renderers (pure functions → HTML strings, inline SVG)       src/site/**
   ▼
dist/  (static host)                                             scripts/build-site.mjs
```

## Layout
```
data/bulletins/            official, verified records (schema v2) — source of truth
data/sources/manifest.json snapshot pin + hash for every official record
data/visa-bulletins/       legacy third-party scrape, FROZEN (D21); fallback only, labeled unverified
scripts/                   fetch-archive, build-data, validate-data, crosscheck, build-site, dev, check-site
src/lib/                   pure domain code: period, officialUrl, parseBulletin, validateBulletin, dataset, metrics, chart
src/site/                  html helper, layout, components, pages
src/client/                small browser scripts (theme, tabs, feedback) and the planner island (React)
src/greenCardTimeline.js   planner rules engine (pure)
public/                    static files copied as-is (robots, headers, icons)
test/                      node:test suites + fixtures (three official pages)
docs/                      strategy, decisions, stories, runbooks, logbook
```

## Schema v2 (`data/bulletins/YYYY/YYYY-MM.json`)
```
{ schemaVersion: 2, period: "2025-06",
  bulletin: { month, year, fiscalYear, title, officialSourceUrl },
  source:   { publisher, officialUrl, retrievedVia, snapshotUrl, snapshotTimestamp, sha256, parserVersion },
  areas:    { <areaKey>: <label as printed> },            // union of columns this bulletin lists
  categories: { familySponsored|employmentBased: { <categoryKey>: {
      label,                                              // row label as printed
      finalActionDates: { <areaKey>: "YYYY-MM-DD"|"Current"|"Unavailable" },
      datesForFiling?:  { ... }                           // absent before October 2015
  } } } }
```
Area keys: `all` (All Chargeability Areas Except Those Listed), `china`, `india`, `mexico`, `philippines`, plus
historical ones as they appear (for example `elSalvadorGuatemalaHonduras`, `vietnam`, `dominicanRepublic`).
An area a bulletin does not list is charged to `all` — resolved at read time, never written into the file.
Category keys: `F1 F2A F2B F3 F4`, `EB1 EB2 EB3 EB3OW EB4 EB4SR EB5` and the EB-5 variants as printed per era.

## Rules that must not break
- Never write a value that is not on the official page. Unknown label/column/cell → the parser throws.
- A period is "verified" only with a manifest entry whose hash matches the parsed bytes.
- Dates are ISO strings handled in UTC. `Current` and `Unavailable` are states, not dates.
- Legacy data is never edited; it is replaced period by period and labeled until then.
- Page renderers escape all interpolated values by default.

## Runtime
Static files only. Client JS: theme toggle + small enhancements on every page; React loads on `/planner/` only.
No cookies. Network calls: none, except the optional feedback POST when `FEEDBACK_ENDPOINT` is configured.

## Build-time configuration (public values only)
`SITE_URL` (canonical/sitemap; omitted if unset), `FEEDBACK_ENDPOINT`, analytics settings (S-403), sponsor block (S-601).

## Debt and risks (priority order)
1. Official backfill not yet run for all months (owner action O4) → most history still legacy/unverified.
2. New months depend on an archive snapshot existing; manual fallback documented in RUNBOOKS RB2.
3. Parser is proven on three eras (2003, 2015, 2025); other eras will surface unknown labels on first run — by design it stops rather than guesses.
4. Planner still React; USCIS chart designation not yet in the data.
