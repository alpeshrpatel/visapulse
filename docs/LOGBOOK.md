# Progress Logbook (append-only; newest at bottom). Resume point = last entry's "NEXT".

Format: `## YYYY-MM-DD HH:MM — <story ids>` · Done · Decisions · Problems · Files · NEXT (exact first action).

## 2026-11-16 — Bootstrap (CEO/PM pass)
- Done: reviewed repo (Vite+React18+Recharts, 290 bulletin JSONs 2002-01→2026-11, planner rules engine, 16 passing node tests). Wrote docs/ARCHITECTURE, DECISIONS, RUNBOOKS, STORIES, MVP, MVP_DETAILED, MASTER_PROMPT.
- Findings: data scraped from visabulletin.ai (not official); App.jsx 886-line monolith; dist/ tracked; README empty; feedback email hardcoded to a third party; index.html title hardcoded "October 2026"; no CI/lint/TS; all JSON eagerly bundled.
- Decisions: D1–D15 in DECISIONS.md.
- NEXT: start S-001 (then S-002, S-003 …). Run `npm ci && npm test` first.

## 2026-11-16 13:35 — Session 1 kickoff (strategy pass, data spike; no stories closed yet)
- Done: read all docs + code; `npm ci`; `npm test` → 16/16 pass. Audited dataset. Spiked an official-source route.
- Findings (data, serious):
  - Legacy dataset (`data/visa-bulletins/`, scraped from visabulletin.ai via r.jina.ai) is far worse than documented: **77 of 290 files have no categories at all**, 74 more have no family table, 3 have no employment table; 4,310 of 20,510 cells are "Unavailable" (many are parser fill-ins from the old script's `relaxed` mode, i.e. not real data). `datesForFiling` is populated before Oct 2015 although that chart did not exist then.
  - `officialSourceUrl` is wrong for every Oct–Dec bulletin (State files them under the *fiscal* year folder) and for 5 irregular file names (2009-03/09/10/11, 2012-10).
  - Official pages list only oversubscribed countries (June 2003 shows just All Chargeability / Mexico / Philippines); the fixed 5-column legacy schema cannot represent that.
- Findings (sources): travel.state.gov and uscis.gov return **HTTP 403 (Cloudflare) to scripted clients**, including an honest default `curl` UA. We do not spoof a browser. The Internet Archive Wayback Machine holds the official bulletin pages for 2002-01 → 2026-07 (CDX lists 291 distinct bulletin URLs; 2026-08…2026-12 not archived yet) and serves original bytes (`id_` mode).
- Built: `scripts/fetch-archive.mjs` (polite, 1 req/1.2 s, pins snapshot timestamp + SHA-256 in `data/sources/manifest.json`, raw HTML in git-ignored `.cache/official/`), `src/lib/period.js`, `src/lib/officialUrl.js`. Fetched 3 fixtures: 2003-06, 2015-10, 2025-06.
- Problems: the session's permission classifier **denied the bulk archive download** (291 pages) as "Unauthorized Access"; a 3-page fixture fetch was allowed after the owner said "try again". I am not chunking around the denial. Research subagent died on a plan usage limit (no output).
- Gray area flagged: retrieving public-domain federal pages from the Internet Archive because the publisher's CDN blocks scripts. Conservative choice taken: no UA spoofing, no Save-Page-Now triggering, archive copies only, and the bulk run is left to the owner.
- Owner actions:
  1. **Approve/run the official backfill** (one step): `node scripts/fetch-archive.mjs` then `npm run data:build` (script lands in S-103). Until then only 3 months are official-verified and the site keeps showing the legacy set, labeled as unverified.
- Files: scripts/fetch-archive.mjs, src/lib/period.js, src/lib/officialUrl.js, data/sources/manifest.json, .gitignore.
- NEXT: quick competitor/source search (≤4 queries) → write docs/STRATEGY.md → append D16+ to docs/DECISIONS.md → rewrite STORIES/MVP/MVP_DETAILED/ARCHITECTURE/RUNBOOKS → build `src/lib/parseBulletin.js` against the 3 fixtures in `.cache/official/`.
