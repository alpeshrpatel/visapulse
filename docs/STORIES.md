# Stories (execute top-down; status: READY | IN_PROGRESS | DONE | BLOCKED)
Size: S ≤ 1h, M ≤ 3h, L ≤ 1 day. One commit per story: `S-xxx: title`. Every story ends with `npm run check` green
(test + typecheck + data validation + build + built-site check). Backlog rewritten 2026-11-16 to match docs/STRATEGY.md;
the seed stories S-001…S-045 are mapped at the bottom.

## PHASE 0 — Foundation (MVP-0: a base we can trust)

### S-101 Repo hygiene — READY — S
- AC: `dist/` untracked and ignored; `.cache/`, `.env*` ignored; package renamed `visapulse`; `.nvmrc`; `.editorconfig`; README covers what/why, commands, data provenance, disclaimer, deploy.

### S-102 Official-source fetcher (Internet Archive) — DONE (bulk run BLOCKED → O4) — M
- AC: `scripts/fetch-archive.mjs [from [to]] [--refresh]` resolves the newest HTTP-200 snapshot of the official bulletin URL, saves original bytes to `.cache/official/`, records `officialUrl, snapshotTimestamp, snapshotUrl, sha256, bytes` in `data/sources/manifest.json`; polite (≥1.2 s between requests); idempotent; fiscal-year folder and irregular file names handled.
- Blocked part: downloading all 2002–2026 months needs the owner's go-ahead (`npm run data:backfill`).

### S-103 Official bulletin parser + schema v2 + `data:build` — READY — L
- AC: `src/lib/parseBulletin.js` turns an official bulletin HTML page into schema v2 (D20): family and employment tables, Final Action and (from Oct 2015) Dates for Filing, only the columns the page lists, values `YYYY-MM-DD | "C" → Current | "U" → Unavailable`. Throws on any unknown row label, column, or cell. `scripts/build-data.mjs` writes `data/bulletins/YYYY/YYYY-MM.json` for every cached page with its provenance block; never overwrites a changed file without `--force`. Fixture tests for 2003-06, 2015-10, 2025-06 with spot-checked cells.

### S-104 Validator + cross-check report — READY — M
- AC: `src/lib/validateBulletin.js` checks shape, period/file agreement, date validity, cutoff not after the bulletin month, required categories, column consistency, provenance present. `npm run data:validate` validates every official file and fails non-zero on any error. `npm run data:crosscheck` writes `docs/data/CROSSCHECK.md` listing every cell where legacy ≠ official.

### S-105 Dataset access layer — READY — M
- AC: `src/lib/dataset.js` loads official records, falls back to legacy only where no official record exists, tags each record `verified: true|false`, treats empty legacy files as "no data", resolves an unlisted area to All Chargeability, exposes `getCutoff(period, chart, category, area)` and series helpers. Unit tested.

### S-106 Feedback without a hardcoded inbox — READY — S
- AC: no personal email anywhere in source; endpoint from `FEEDBACK_ENDPOINT` at build time; widget absent when unset; honeypot field; 30 s client throttle; no mailto fallback.

### S-107 CI — READY — S
- AC: `.github/workflows/ci.yml` runs `npm ci && npm run check` on push and pull request with Node from `.nvmrc`; npm cache on.

## PHASE 1 — Static site (MVP-1: findable and fast)

### S-201 Generator core + home page (spike, then keep) — READY — L
- AC: `npm run build` renders `dist/index.html` from the latest bulletin through `src/site/` template functions with auto-escaping; hashed CSS/JS via esbuild; `npm run dev` rebuilds on change and serves locally. Home shows both charts for family and employment, movement vs the previous month, source line with official link and verification status, disclaimer. Spike result (build time, page weight) logged.

### S-202 One page per bulletin month + archive index — READY — M
- AC: `/visa-bulletin/<month>-<year>/` for every period with data; prev/next links; `/visa-bulletin/` index grouped by fiscal year; months with no data say so and link to the official page.

### S-203 Category × area pages with history — READY — L
- AC: `/priority-dates/<category>/<area>/` for each current category and area: current cutoffs on both charts, change over 1 and 12 months, inline SVG history chart with a text alternative, yearly history table, list of retrogressions; `/priority-dates/` index.

### S-204 Planner page — READY — M
- AC: `/planner/` mounts the existing planner as the only React island, fed the latest bulletin; planner tests still pass; page works at 375 px.

### S-205 Trust pages and persistent disclaimer — READY — S
- AC: `/about/`, `/methodology/` (sources, snapshot pinning, validation, limits), `/disclaimer/`, `/privacy/`; footer disclaimer and official-source links on every page.

### S-206 SEO and sharing — READY — S
- AC: unique title + description per page; canonical, Open Graph, sitemap.xml only when `SITE_URL` is known; robots.txt; JSON-LD (`WebSite`, `Dataset`); 404 page; no month hardcoded in any static title.

### S-207 Open data + RSS — READY — S
- AC: `/data/latest.json`, `/data/bulletins/<period>.json`, `/data/cutoffs.csv`, `/feed.xml` (one item per bulletin, newest 24); documented on `/data/`.

### S-208 Cut over and remove the SPA — READY — M
- AC: Vite, Recharts and the old `App.jsx` removed; `npm run check` green; pages verified at 375/768/1280 in light and dark with no console errors; results logged.

### S-209 Accessibility and performance pass — READY — M
- AC: keyboard-complete; AA contrast both themes; reduced motion respected; total JS on a bulletin page < 15 kB gz; Lighthouse (or equivalent manual audit) results logged.

## PHASE 2 — Tools (MVP-2: answers my question)

### S-301 Priority-date checker — READY — M
- AC: `/check/`: date + category + area → status on both charts for the latest bulletin, days to cutoff, 12/24-month movement of that line; state in the URL (shareable); nothing leaves the browser; wording passes the "not a prediction" rule (D27).

### S-302 Monthly summary and movement highlights — READY — M
- AC: each bulletin page opens with a deterministic plain-English summary (advances, retrogressions, newly current/unavailable, unchanged) generated from data and unit tested.

### S-303 USCIS chart designation — READY — M
- AC: `data/uscis-filing-charts.json` (period → family chart, employment chart, source URL, date checked); shown on home, bulletin pages, checker and planner; months without an entry say "check USCIS" with the link. Entries only from the official page.

### S-304 Planner polish — READY — M
- AC: only relevant fields shown per route/path; printable summary; shareable link; rule branches ≥ 90% line coverage.

### S-305 Historical pace panel — READY — M
- AC: per category × area: median and range of monthly movement over trailing 12/24/60 months, months spent retrogressed; labeled "what happened, not a forecast".

### S-306 Compare view — READY — M
- AC: up to 5 lines (category × area) on one SVG chart, CSV export.

## PHASE 3 — Launch and advertise (MVP-3)

### S-401 Deploy configuration — READY — S
- AC: `public/_headers` (security + cache), `_redirects`, deploy runbook for Cloudflare Pages and Netlify, `.env.example`. Deploy itself is an owner action.

### S-402 Monthly refresh automation — READY — M
- AC: `.github/workflows/refresh-data.yml` runs daily on days 8–25: if next month's official file is missing, poll the archive, parse, validate, cross-check, open a PR with a movement table. Manual path `npm run data:add -- <period> --file <saved.html>` documented.

### S-403 Privacy-friendly analytics — READY — S
- AC: cookieless analytics snippet injected only when `ANALYTICS_SNIPPET_*` env is set; documented in privacy page.

### S-404 Social cards — READY — M
- AC: per-bulletin and default Open Graph image generated at build (SVG → PNG) with month and headline movement.

### S-405 Launch kit — READY — M
- AC: `docs/LAUNCH.md`: positioning, one-liner, channel plan with each community's self-promotion rules, drafted posts (Show HN, Reddit, LinkedIn, X), outreach list template for attorneys/bloggers, Search Console + Bing steps, bulletin-day checklist, success metrics. Posting is an owner action.

### S-406 Bulletin-day ritual — READY — S
- AC: runbook + script printing the month's summary, changed lines and ready-to-post text after a data merge.

## PHASE 4 — Alerts and retention (MVP-4)

### S-501 Subscription API (Worker + D1) — BLOCKED (owner accounts) — L
- AC: subscribe / confirm / unsubscribe endpoints, double opt-in, Turnstile, rate limit, input validation, minimal stored data. Code and tests can be written unblocked; deploy needs Cloudflare + Resend accounts.
### S-502 Alert digest job — BLOCKED (S-501) — L
- AC: after each data merge, one email per subscriber whose line changed or became current; old → new, days moved, link, one-click unsubscribe.
### S-503 Subscribe UI — READY after S-501 — M
- AC: form on bulletin, category and checker pages; privacy page updated; delete-my-data link.

## PHASE 5 — Scale and monetize (MVP-5)

### S-601 Sponsor slot + media kit — READY — S
- AC: one labeled sponsor block, env-configured, absent when unset; `/advertise/` page with audience facts and contact.
### S-602 Employer / attorney watchlist — READY — M
- AC: paste or load a CSV of (label, category, area, priority date) → status table for the latest bulletin, all in the browser, export CSV.
### S-603 Fiscal-year summary pages — READY — M
### S-604 Category explainers (EB-1…EB-5, F1…F4) with cited statute and limits — READY — M
### S-605 i18n scaffold (es, hi, zh) — READY — L
### S-606 Embeddable widget for blogs — READY — M
### S-607 Paid watchlist / data API decision — READY — S (decision record from real usage data)
(Expand S-603…S-607 to full acceptance criteria when they reach the top.)

## Seed mapping (old → new)
S-001, S-002 → S-101 · S-003, S-004, S-015(lint) → S-107 (lint deferred, D28) · S-005 → S-103/S-104 · S-006 → dropped (D17) · S-007, S-008 → replaced by S-201…S-208 (D16) · S-009 → S-102/S-103 · S-010 → S-402 · S-011, S-012 → dropped for now (D23) · S-013 → S-106 · S-014 → S-206 · S-015 → S-205 · S-016 → folded into static URLs + S-301 · S-017 → S-306 · S-018 → S-302 · S-019 → S-301 · S-020 → S-304 · S-021 → S-209 · S-030…S-032 → S-501…S-503 · S-040 → S-203/S-305 · S-041 → S-305 · S-042 → S-603 · S-043 → S-604 · S-044 → S-605 · S-045 → S-403.
