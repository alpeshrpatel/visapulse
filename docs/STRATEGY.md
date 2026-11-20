# VisaPulse — Strategy (one page, written 2026-11-16, owner of record: the executing agent)

## Users and the job they hire us for
| User | Job to be done | How often |
|------|----------------|-----------|
| Backlogged applicant (EB-2/EB-3 India & China, F-categories Mexico/Philippines) | "Is my priority date current yet? How far did my line move? What do I do next?" | Monthly, on bulletin day, for years |
| Employer / HR / mobility team | "Which of our people became current this month?" | Monthly |
| Immigration attorney / paralegal | Fast, citable lookup of any month's cutoff and its history | Weekly |

## Value proposition
**The Visa Bulletin you can trust and actually read.** Every number traces to the official State Department page (with a pinned archive snapshot and hash), every month since 2002 is one click away, movement is explained in plain English, and nothing is presented as a prediction.

## Why we can win (competitive read, Nov 2026)
- Law-firm blogs (Fragomen, Morgan Lewis, Ogletree, dozens of small firms) own "visa bulletin <month> <year>" searches with one prose post a month: no history, no lookup, lead-gen framing.
- visagrader.com shows the pattern that ranks: one page per category × country with a chart and "predictions". CitizenPath, Locke and others offer wait-time estimators that applicants on Blind criticise as naive subtraction.
- pagecrawl.io sells generic page-change alerts; the official sites offer no alerts at all.
- Gap: nobody combines *verifiable provenance* + *complete history* + *honest framing*. Trust is the moat; it is cheap for us and awkward for lead-gen sites.
- Risk: a site called visapulseusa.com already exists (brand collision, see DECISIONS O3).

## Feature bets (impact ÷ effort, highest first)
1. **Official, verified dataset** with provenance per month (fixes today's reality: 151 of 290 legacy files are empty or partial). *Everything depends on it.*
2. **Static, indexable pages**: one per bulletin month, one per category × country, with history chart and table. This is the distribution engine.
3. **Priority-date checker**: enter date + category + country → current / not current on both charts, how the line moved, historical pace (labeled as history).
4. **Plain-English monthly summary + RSS + open data (JSON/CSV)**: free alerts and backlinks with zero backend.
5. **Planner** (exists): keep deterministic, polish, link from every page.
6. **USCIS chart designation** per month (which chart USCIS accepts for I-485): high value, manual-with-citation at first.
7. **Email alerts** (double opt-in), then **employer watchlist** (in-browser CSV, nothing uploaded).
8. Later: fiscal-year pages, explainers, i18n (es/hi/zh), embeddable widget.

## Data sources and risks
| Data | Source | Risk and mitigation |
|------|--------|---------------------|
| Cutoff dates 2002→now | travel.state.gov bulletin pages (public domain, 17 U.S.C. §105) read from Internet Archive snapshots | State's CDN returns 403 to scripts; we never spoof a browser. Archive lag for new months → manual fallback from a browser-saved official page. |
| Chart designation | uscis.gov "Adjustment of Status Filing Charts" | Same 403; entered by hand with citation until automated safely. |
| Limits, per-country cap | INA §§201–203 and State's annual limits notice | Static, cited in explainers. |
| Legacy scrape (visabulletin.ai) | Third party | Demoted: never the source once an official record exists; shown as "unverified" until replaced; then removed from the build. |
Rules: no invented values, estimates labeled, validator gates every build, cross-check report on every change.

## Stack (decided, see D16–D24)
Static-first, almost dependency-free: a small in-repo generator (plain ESM JavaScript, typed with JSDoc and `tsc --checkJs`) renders every page to HTML at build time; charts are build-time inline SVG; esbuild bundles the few client scripts (planner, checker, theme). No framework, no chart library, no backend. Output is a `dist/` folder any static host can serve; Cloudflare Pages recommended. Tests: `node:test`.

## Monetization and sustainability
- Running cost ≈ $0 (free static hosting; a domain ≈ $12/yr). No server to keep alive, so the site survives neglect.
- Monthly upkeep is automated: a scheduled job proposes the new bulletin as a pull request; a human approves in about two minutes. Bus factor: any JavaScript developer or coding agent can run `npm run data:add`.
- Core stays free. Revenue order: (1) one clearly labeled flat-fee sponsor slot, (2) labeled affiliate links to filing services, (3) paid employer/attorney watchlist and data API. No per-lead attorney referral fees (legal-ethics rules restrict them; needs counsel before any attorney program).
- If a source disappears: the dataset is self-contained in git with hashes; archive snapshots remain; the parser accepts any saved official page.

## Distribution
Detailed plan (added 2026-11-16): `docs/growth/README.md` and the files beside it.

SEO landing pages → monthly "bulletin day" ritual (summary page, RSS, social card) → community posts where allowed (r/USCIS, r/greencard, Trackitt, Blind) → open data and an embeddable widget for bloggers and attorneys → email list. Launch kit in Phase 3.

## 12-month view
| Quarter | Outcome |
|---------|---------|
| Q4 2026 | Official dataset live, static site shipped, launch kit ready, first deploy (owner) |
| Q1 2027 | Checker, summaries, chart designation, monthly automation running, Search Console traction |
| Q2 2027 | Email alerts, employer watchlist, first sponsor conversation |
| Q3 2027 | i18n, fiscal-year pages, pace history; decide on Pro tier from real usage |

Not doing: accounts, case-status tracking, legal advice, chatbots, predictions presented as fact, native apps.
