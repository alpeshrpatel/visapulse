# Stories — the board

**How to use this file.** Every open story has its own file in `docs/stories/` with the goal, exact files, numbered
steps, tests, acceptance boxes and pitfalls. Read `docs/stories/README.md` once (rules, project map, recipes), then
take the first story in the **Ready queue** below, open its file, and follow it. This board only tracks status and order.

Statuses: `READY` · `IN_PROGRESS` · `REVIEW` (finished; a person must read it before it is published) · `BLOCKED` (owner) · `DONE`.
Size: S ≤ 1 h, M ≤ 3 h, L ≤ 1 day. Difficulty: Routine / Careful / Expert (see README §9: which model should take it).

**Standing owner instructions (2026-11-16):** do not commit, push or deploy; do not run `npm run data:backfill`.
Every story ends with `npm run check` green, its status updated here and in its file, and a logbook entry.

| Phase | MVP | Theme | Stories | State |
|-------|-----|-------|---------|-------|
| 0 | MVP-0 | Foundation: data we can trust | S-101…S-112 | core done; backfill follow-ups open |
| 1 | MVP-1 | Static site: findable and fast | S-201…S-212 | shipped; audit and extras open |
| 2 | MVP-2 | Tools: answers my question | S-301…S-308 | checker shipped |
| 3 | MVP-3 | Launch and advertise | S-401…S-410 | kit, deploy config, automation done |
| 4 | MVP-4 | Alerts and retention | S-501…S-505 | open |
| 5 | MVP-5 | Scale and monetize | S-601…S-609 | open |
| 6 | MVP-6 | Insight: data beyond the bulletin | S-701…S-706 | open |
| 7 | MVP-7 | Growth engineering: pages and tools that bring people in | S-801…S-810 | open (new 2026-11-16; plan in `docs/growth/`) |

---

## Ready queue (take the first `READY` one whose "Needs" are met)

### A. No owner input needed — Routine and Careful (any model)
| # | Story | Title | Status | Size | Difficulty | Needs |
|---|-------|-------|--------|------|------------|-------|
| 1 | [S-302](stories/S-302.md) | Monthly summary in plain English | IN_PROGRESS | M | Careful | – |
| 2 | [S-303](stories/S-303.md) | USCIS chart designation (data file, validator, wording) | READY | M | Careful | – |
| 3 | [S-111](stories/S-111.md) | Data freshness guard | READY | S | Routine | – |
| 4 | [S-804](stories/S-804.md) | Titles and descriptions written for search results | READY | S | Routine | – |
| 5 | [S-803](stories/S-803.md) | Question-and-answer block on category × area pages | READY | S | Routine | – |
| 6 | [S-801](stories/S-801.md) | Country hub pages | READY | M | Careful | – |
| 7 | [S-211](stories/S-211.md) | Jump box | READY | S | Careful | – |
| 8 | [S-307](stories/S-307.md) | Share and print | READY | S | Routine | – |
| 9 | [S-807](stories/S-807.md) | Share kit: copy as text and the phone share sheet | READY | S | Routine | – |
| 10 | [S-305](stories/S-305.md) | Historical pace panel | READY | M | Careful | – |
| 11 | [S-403](stories/S-403.md) | Privacy-friendly analytics (off by default) | READY | S | Routine | – |
| 12 | [S-407](stories/S-407.md) | Structured data for search engines | READY | S | Routine | – |
| 13 | [S-406](stories/S-406.md) | Bulletin-day helper | READY | S | Routine | – |
| 14 | [S-504](stories/S-504.md) | Follow-by-feed page (`/alerts/`) | READY | S | Routine | – |
| 15 | [S-806](stories/S-806.md) | "Is the next bulletin out?" page | READY | S | Careful | – |
| 16 | [S-808](stories/S-808.md) | "Cite this page" and a press/fact sheet | READY | S | Routine | – |
| 17 | [S-608](stories/S-608.md) | Changelog and corrections log | READY | S | Routine | – |
| 18 | [S-112](stories/S-112.md) | Supply-chain hygiene | READY | S | Routine | network for SHA lookup |
| 19 | [S-209](stories/S-209.md) | Accessibility and performance audit | IN_PROGRESS | M | Careful | a browser tool |
| 20 | [S-404](stories/S-404.md) | Social cards (link preview images) | READY | M | Careful | one `npm install` |
| 21 | [S-703](stories/S-703.md) | Processing-time and case-stage link-outs | READY | S | Routine | three addresses confirmed in a browser |
| 22 | [S-809](stories/S-809.md) | Search report from Search Console exports | READY | S | Routine | – |
| 23 | [S-810](stories/S-810.md) | IndexNow (dry run only; owner sends) | READY | S | Careful | – |
| 24 | [S-601](stories/S-601.md) | Sponsor slot and advertise page | READY | S | Routine | – |
| 25 | [S-609](stories/S-609.md) | Data API terms and stability | READY | S | Careful | – |
| 26 | [S-606](stories/S-606.md) | Embeddable cut-off card | READY | M | Careful | – |

### B. No owner input needed — Expert (strongest model, or review the output)
| # | Story | Title | Status | Size | Difficulty | Needs |
|---|-------|-------|--------|------|------------|-------|
| 27 | [S-308](stories/S-308.md) | Explainer framework + "Which area am I?" | READY → ends `REVIEW` | S+S | Expert | can read official texts |
| 28 | [S-802](stories/S-802.md) | Plain-language glossary pages | READY → ends `REVIEW` | M | Expert | S-308 |
| 29 | [S-805](stories/S-805.md) | The honest "predictions" page | READY → ends `REVIEW` | M | Expert | S-308 |
| 30 | [S-702](stories/S-702.md) | "How the line works" page | READY → ends `REVIEW` | M | Expert | S-308 |
| 31 | [S-604](stories/S-604.md) | Category guides | READY → ends `REVIEW` | M | Expert | S-308 |
| 32 | [S-304](stories/S-304.md) | Planner polish | READY | M | Expert | S-303 for one step |
| 33 | [S-306](stories/S-306.md) | Compare view | READY | M | Expert | – |
| 34 | [S-602](stories/S-602.md) | Employer and attorney watchlist | READY | M | Expert | – |
| 35 | [S-501](stories/S-501.md) | Subscription API (code and tests only) | READY | L | Expert | – |
| 36 | [S-701](stories/S-701.md) | Source study for demand and processing data | READY | M | Expert | can read web pages |
| 37 | [S-605](stories/S-605.md) | Languages (es, hi, zh) | READY (publishing blocked on reviewers) | L | Expert | S-302, S-303, S-109 preferred |

### C. Waiting on the owner or on another story
| Story | Title | Status | Size | Difficulty | Waiting for |
|-------|-------|--------|------|------------|-------------|
| [S-108](stories/S-108.md) | Full parser coverage after the backfill | READY after backfill | L | Expert | owner runs `npm run data:backfill` (TASKS.md) |
| [S-109](stories/S-109.md) | Retire the legacy fallback | READY after S-108 | S | Careful | S-108; owner reviews `docs/data/CROSSCHECK.md` |
| [S-212](stories/S-212.md) | Rows and areas from other eras | READY after S-108 | S | Careful | S-108 |
| [S-110](stories/S-110.md) | Months the archive does not hold | BLOCKED | S | Routine | owner saves the official pages |
| [S-603](stories/S-603.md) | Fiscal-year summary pages | READY after S-109 | M | Careful | S-109 |
| [S-210](stories/S-210.md) | Planner without React | conditional | M | Expert | only if S-209 shows the planner under target |
| [S-408](stories/S-408.md) | Pre-launch QA on the deployed preview | BLOCKED | S | Careful | owner deploys a preview |
| [S-409](stories/S-409.md) | Search Console and Bing setup | BLOCKED | S | Routine | owner accounts, live domain |
| [S-410](stories/S-410.md) | Thirty-day review | READY 30 days after launch | S | Careful | launch + exports |
| [S-502](stories/S-502.md) | Alert digest job | BLOCKED | L | Expert | S-501 |
| [S-503](stories/S-503.md) | Subscribe interface | READY after S-501 | M | Careful | S-501, S-504 |
| [S-505](stories/S-505.md) | Email compliance pack | BLOCKED | S | Careful | owner: sending domain, postal address |
| [S-607](stories/S-607.md) | Paid tier decision | READY after 60 days of traffic | S | Expert | traffic + owner numbers |
| [S-704](stories/S-704.md) | First demand dataset | BLOCKED | L | Expert | S-701 GO + owner confirmation |
| [S-705](stories/S-705.md) | Visa numbers used per fiscal year | BLOCKED | L | Expert | S-701, S-603, S-704 |
| [S-706](stories/S-706.md) | PERM timing context | BLOCKED | M | Careful | S-701 GO, S-703 |

**Suggested order.** Work queue A top to bottom. In parallel a strong model can take queue B starting with S-308
(it unlocks four content stories). When the owner has run the backfill: S-108 → S-109 → S-212 → S-603 jump to the front.
Before launch the minimum set is: S-302, S-303, S-111, S-804, S-403, S-407, S-406, S-504, S-209, then the owner-gated
S-408 and S-409. The growth plan that explains *why* the Phase 7 stories exist is `docs/growth/README.md`.

---

## Done (one line each; details in `docs/LOGBOOK.md` and git history)
| Story | What shipped |
|-------|--------------|
| S-101 | Repo hygiene: `dist/` untracked, ignore rules, `.nvmrc`, `.editorconfig`, README |
| S-102 | Official-source fetcher via Internet Archive snapshots pinned by timestamp + SHA-256 (`scripts/fetch-archive.mjs`) |
| S-103 | Official bulletin parser, schema v2, `data:build`; verified records for 2003-06, 2015-10, 2025-06 |
| S-104 | Validator, legacy freeze, cross-check report |
| S-105 | Dataset access layer (`src/lib/dataset.js`): official first, legacy labeled or withheld |
| S-106 | Feedback form only when `FEEDBACK_ENDPOINT` is set; honeypot; throttle |
| S-107 | CI workflow running `npm run check` (never run yet: repository not pushed) |
| S-201…S-207 | Static generator, all page types, SEO basics, open data, feed |
| S-208 | Cut over to the static site; Vite, Recharts and the SPA removed |
| S-301 | Priority-date checker at `/check/` (in-browser, state in the URL fragment) |
| S-401 | Deploy configuration (`public/_headers`, `.env.example`, RUNBOOKS RB4) |
| S-402 | Monthly refresh workflow (opens a pull request; never run yet) |
| S-405 | Launch kit (`docs/LAUNCH.md`) |

## Adding a story
Copy the shape of an existing file in `docs/stories/`: header table, Goal, Context, Files to touch, Steps, Tests to add,
Acceptance (checkboxes), Pitfalls. Name exact files and functions. State what is out of scope. Then add a row here.
A story a small model cannot finish from its own file plus the README is not ready: add the missing detail first.

## Seed mapping (old → new)
S-001, S-002 → S-101 · S-003, S-004, S-015(lint) → S-107 (lint deferred, D28) · S-005 → S-103/S-104 · S-006 → dropped (D17) · S-007, S-008 → replaced by S-201…S-208 (D16) · S-009 → S-102/S-103 · S-010 → S-402 · S-011, S-012 → dropped for now (D23) · S-013 → S-106 · S-014 → S-206 · S-015 → S-205 · S-016 → folded into static URLs + S-301 · S-017 → S-306 · S-018 → S-302 · S-019 → S-301 · S-020 → S-304 · S-021 → S-209 · S-030…S-032 → S-501…S-503 · S-040 → S-203/S-305 · S-041 → S-305 · S-042 → S-603 · S-043 → S-604 · S-044 → S-605 · S-045 → S-403.
