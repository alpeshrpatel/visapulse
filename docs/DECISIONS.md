# Decision Log (ADR-lite)
D1–D15 below are the initial CEO **defaults/recommendations**, not mandates. The executing agent has full autonomy over product, data, design, stack, and long-run viability (see MASTER_PROMPT). To change one, append a new entry that supersedes it (ID, decision, why, alternatives rejected, revisit-trigger). Hard constraints (accuracy, legal, privacy, owner control) are not overridable.

| ID | Decision | Why |
|----|----------|-----|
| D1 | **Keep Vite + React 18 + Recharts + plain CSS.** No Next.js, no Tailwind, no UI kit. | App is a static SPA; rewrite = zero user value. |
| D2 | **Migrate to TypeScript, strict, incrementally** (rename file-by-file; `allowJs` during migration). Start with `bulletinMetrics`, `greenCardTimeline`, data types. | Rules engine + schema need type safety. |
| D3 | **Validate all bulletin JSON with Zod** at build/test time (`scripts/validate-data.ts`), not at runtime. | Bad scrape must fail CI, not users. |
| D4 | **Source of truth = travel.state.gov** official bulletin pages. visabulletin.ai demoted to cross-check only. | Accuracy + legal risk. Parser fixtures from official HTML. |
| D5 | **Monthly refresh via GitHub Actions cron** (day 8–20, daily retry) → opens PR with new JSON + validation + diff summary; human merges. | Automation without silent bad data. |
| D6 | **Lazy-load data by year** (dynamic `import()` per year; current + previous year eager). | Cut main bundle. |
| D7 | **Tests: node:test stays for pure modules; add Vitest + @testing-library/react for components; one Playwright smoke test.** | Minimal tooling, real coverage. |
| D8 | **Host: Cloudflare Pages** (static, free, fast). Netlify config removed after cutover. `dist/` removed from git. | Owner's other sites already on Cloudflare. |
| D9 | **No backend for MVP 1–3.** Phase-2 alerts: Cloudflare Worker + D1 + Resend, double opt-in, one-click unsubscribe. | Keep it cheap and simple. |
| D10 | **Planner stays deterministic rules** (no LLM, no predictions presented as fact). Forecasts (M5) are labeled "historical trend, not a prediction". | Trust + liability. |
| D11 | **Persistent disclaimer**: informational only, not legal advice, verify at travel.state.gov / uscis.gov. | Liability. |
| D12 | **Analytics: Cloudflare Web Analytics only** (cookieless). No cookie banner needed. | Privacy, zero friction. |
| D13 | **Feedback: replace formsubmit hardcoded email with `VITE_FEEDBACK_ENDPOINT`**; default to a Cloudflare Worker/Form the OWNER controls. | Currently routes to a third party's inbox. |
| D14 | **Monetization deferred** until M4. Candidates: email alerts free, "attorney referral" later. Not before trust is built. | Focus. |
| D15 | **Lint/format: ESLint (typescript-eslint) + Prettier**, enforced in CI. | Agents need guardrails. |

## OPEN items needing the owner (agent must NOT block on these; use the stated default)
- O1 Confirm feedback inbox ownership → default: env var, empty = widget hidden.
- O2 Domain name → default: Cloudflare `*.pages.dev`.
- O3 Brand name `visapulse` final? → default: yes.

## Session 1 decisions (2026-11-16) — columns: ID · decision · why · rejected · revisit when
| ID | Decision | Why | Alternatives rejected | Revisit trigger |
|----|----------|-----|-----------------------|-----------------|
| D16 | **Static multi-page site from a small in-repo generator** (plain ESM JS template functions → HTML; esbuild for client bundles). Supersedes D1, D6. | Per-page HTML is our only free distribution (search); data is rendered, never shipped as a JS bundle; no framework upgrades for a site meant to run for years; page renderers are pure functions testable with `node:test`. | Astro 7 (best fit on paper, but needs Node ≥ 22.23.4, two majors in ~18 months, ~300 packages); Next.js static export (heavy runtime for table pages); SPA + prerender plugin (keeps the monolith). | More than three stateful client islands, or non-developer content authors. |
| D17 | **JavaScript + JSDoc types checked by `tsc --checkJs`** instead of a TypeScript migration. Supersedes D2. | Same checking with no transpile step for scripts and tests. | `.ts` + tsx/strip-types (extra tooling, Node-version sensitive). | Generator exceeds ~3k lines or types become awkward. |
| D18 | **Hand-written validator** (`src/lib/validateBulletin.js`), no Zod. Refines D3 (validation still gates build and CI). | Zero dependencies, domain-specific error messages, semantic checks Zod cannot express. | Zod, JSON Schema + ajv. | Schema is consumed by third parties. |
| D19 | **Source of truth = official State Department bulletin pages, read from Internet Archive snapshots pinned by timestamp + SHA-256.** Refines D4. No user-agent spoofing, no triggering of Save Page Now. | travel.state.gov returns 403 to scripts; the archive serves the original public-domain bytes and allows programmatic access; pinning makes every number reproducible. | Spoofing a browser (dishonest, likely against terms); continuing the third-party scrape (unverifiable, 52% holes). | State publishes an API/feed, or the archive stops capturing bulletins. |
| D20 | **Schema v2**: only the columns a bulletin actually lists; `datesForFiling` absent before Oct 2015; canonical category keys; provenance block per file; unlisted area resolves to "All Chargeability" at read time (that is the bulletin's own rule). | The legacy fixed 5-column shape forced invented "Unavailable" cells. | Padding missing columns at parse time. | A bulletin introduces a structure the schema cannot hold. |
| D21 | **Legacy dataset is frozen and demoted**: kept byte-for-byte in `data/visa-bulletins/`, used only for months with no official record, always labeled "unverified third-party compilation"; dropped from the build once the official backfill covers its range. | Honors "never lost or silently altered" while ending reliance on it. | Deleting it now (loses coverage until backfill); silently patching it. | Official backfill complete and cross-check report reviewed. |
| D22 | **Charts are build-time inline SVG**; Recharts removed. | Zero JS, accessible, prints, indexable; one less large dependency. | Recharts island (~100 kB), canvas chart libs. | Users need zoom/brush interactions. |
| D23 | **Tests: `node:test` for everything pure (parser, validator, metrics, planner rules, page renderers) + a built-site check (links, titles, canonicals).** Vitest/RTL/Playwright dropped for now. Supersedes D7. | Almost all logic is pure; UI is verified in a real browser per release and logged. | Full component + e2e stack before there is client UI to test. | Client-side code exceeds ~500 lines. |
| D24 | **Hosting-neutral `dist/`**, `_headers`/`_redirects`, site URL from `SITE_URL` (falls back to Netlify's `URL`; canonical/sitemap omitted if unknown). D8's Cloudflare Pages recommendation stands. | Wrong canonicals are worse than none; no lock-in. | Hardcoding a domain. | Domain chosen (O2). |
| D25 | **Distribution-first product shape**: a page per bulletin month and per category × country, RSS feed, open JSON/CSV. | These earn search traffic and links without a marketing budget. | Single-page dashboard. | Search Console shows the pages not indexing. |
| D26 | **Monetization**: core free; flat-fee labeled sponsorship, then labeled affiliates, then paid watchlist/API. No per-lead attorney referral fees. Refines D14. | Trust first; referral fees to non-lawyers are restricted by legal-ethics rules (needs counsel). | Display-ad networks (privacy, layout cost), paywalling history. | 10k monthly visitors or first inbound sponsor. |
| D27 | **"Historical pace", never "prediction"**: any forward-looking number is a labeled description of past movement with its window stated. D10 stands. | Honesty constraint; applicants already distrust naive estimators. | ML or extrapolated arrival dates. | Never without owner + counsel sign-off. |
| D28 | **Gate = tests + typecheck + data validation + built-site check.** ESLint/Prettier deferred. Supersedes D15. | Keeps the toolchain at three dev dependencies. | Full lint stack now. | Second regular contributor. |
| D29 | **Fetch tooling is polite and pinned**: 1 request / 1.2 s, descriptive user agent, never re-resolves a pinned snapshot unless `--refresh`. | Good citizenship toward the archive; reproducible builds. | Parallel downloads. | Archive publishes different guidance. |
| D30 | **Planner stays a React island for now** (only page that loads React); rewrite to plain JS only if it blocks performance goals. | Smallest safe migration of working code. | Rewriting 370 lines of form UI during the cutover. | Planner page fails Lighthouse ≥ 95. |

## OPEN items — session 1 additions
- O3 (updated) **Brand collision**: visapulseusa.com exists (a "green card estimator" site). Default: keep "VisaPulse" as the working name, buy no domain and run no paid promotion until the owner checks trademark/confusion. Fallback names to consider: PriorityPulse, BulletinPulse, CutoffWatch.
- O4 **Bulk official backfill** needs the owner's go-ahead (the session's permission layer blocked it). Default: owner runs `npm run data:backfill`.
- O5 Attorney-referral or affiliate programs need a lawyer's review before launch. Default: sponsorship only.
