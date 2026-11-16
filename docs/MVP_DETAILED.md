# Detailed MVP spec — read this to understand the product (low level)

## Domain primer (so agents don't guess)
- The monthly **Visa Bulletin** (US State Dept) lists, per preference category and country, a **cutoff date**. A person is eligible to proceed when their **priority date (PD)** is **earlier than or equal to** the cutoff. `Current` = everyone eligible. `Unavailable` = no numbers.
- Two charts per category: **Final Action Dates** (when a green card can be approved) and **Dates for Filing** (when you may file adjustment/NVC docs, if USCIS allows that chart that month). Both stored per bulletin.
- Family: F1 (unmarried adult kids of USC), F2A (spouse/kids of LPR), F2B (unmarried adult kids of LPR), F3 (married kids of USC), F4 (siblings of USC). Immediate relatives have no cutoff.
- Employment: EB1 (priority workers), EB2 (advanced degree/NIW), EB3 (skilled/professional; "Other Workers" subline), EB4 (special immigrants; Religious subline), EB5 (investors; Unreserved / High Unemployment / Infrastructure / Rural from 2022).
- Areas: a bulletin lists only *oversubscribed* areas as separate columns (today: China-mainland, India, Mexico, Philippines; historically also e.g. El Salvador/Guatemala/Honduras, Vietnam, Dominican Republic). Everyone else — and any area not listed that month — uses **All Chargeability Areas Except Those Listed**. June 2003, for example, lists only Mexico and the Philippines.
- The **Dates for Filing** chart exists only from the October 2015 bulletin onward. Each month USCIS announces which chart it accepts for I-485 filing (S-303).
- Fiscal year runs Oct–Sep; October bulletins often reset/advance dates. Retrogression (cutoff moves earlier) is common late in FY.
- Official fixtures: `test/fixtures/official/` (June 2003, October 2015, June 2025). Verified records: `data/bulletins/`. Legacy (unverified, frozen): `data/visa-bulletins/`.

## Pages (target, see STORIES Phase 1–2)
1. **Home `/`**: latest bulletin — both charts for family and employment, change vs previous month, plain-English summary, source line (official link + verified/unverified), entry points to checker and planner.
2. **Bulletin `/visa-bulletin/<month>-<year>/`**: same layout for any month; prev/next; archive index by fiscal year.
3. **Category × area `/priority-dates/<category>/<area>/`**: current cutoffs, 1- and 12-month change, inline SVG history, yearly table, retrogressions, historical pace (labeled).
4. **Checker `/check/`**: priority date + category + area → status on both charts; shareable URL; runs in the browser only.
5. **Planner `/planner/`**: inputs (route, path, PD, area, cross-chargeability, PERM/I-140/I-130 status, case stage…) → `buildGreenCardPlan` → eligibility, ordered steps `action|wait|caution`, one next step. Never a timeline guarantee.
6. **Trust**: about, methodology, disclaimer, privacy, open data, RSS.
7. Later: alerts, watchlist, compare, fiscal-year pages, explainers.

## Behavior rules (do not break)
- Dates are ISO strings, compared lexicographically only after `getUtcTimestamp` validation; always format in UTC (no off-by-one).
- Missing data → "Date unavailable", never crash. Unknown category/country → skipped, not thrown.
- Movement: delta in days between previous and current valid date; `Current`↔date transitions are labeled, not numeric.
- Planner: if input is ambiguous, return `caution` step telling the user what to confirm; never infer legal exemptions (e.g. PERM).
- Copy is plain English, grade-8, always with "check official sources".

## Data contract (S-102…S-104)
`fetch-archive` pins an official page snapshot (timestamp + SHA-256) → `build-data` parses it into `data/bulletins/YYYY/YYYY-MM.json` (schema v2, see ARCHITECTURE) → `validate-data` gates the build. Fail loudly (non-zero exit) on unknown rows, columns or cells. Idempotent. Never overwrites a changed file unless `--force`. Never pads a missing column. Legacy files are never modified.

## Test matrix (minimum)
- Pure: assessCutoff (current/unavailable/equal/after/invalid), offsetPeriod across year boundary, coverage, movement.
- Planner: each `nextStep` branch, both paths, cross-chargeability, EB5 variant fallback, immediate relative.
- Data: every JSON passes schema; spot-check known cells (2025-06 F1 Mexico final = 2005-04-22).
- Parser: three official fixtures (2003, 2015, 2025) with spot-checked cells; unknown label/column/cell throws.
- Renderers: each page type renders, escapes input, and contains its source line and disclaimer.
- Built site (`scripts/check-site.mjs`): every internal link resolves, every page has one h1, a title and a description.
- UI: checked in a real browser at 375/768/1280, light and dark, per release (logged).

## Alerts spec (MVP-4)
Subscribe(email, category, group, country, chart, optional PD) → confirm email → active. On each new bulletin: send one email per subscriber if (a) their cell changed, or (b) PD ≤ cutoff newly. Email shows old→new, days moved, link to site with state URL, unsubscribe. Store minimum data; delete on unsubscribe. Privacy page required before launch.

## Quality bars
LCP < 2 s on 4G mobile · bulletin-page JS < 15 kB gz (React only on /planner/) · a11y AA · no console errors · every page readable with JavaScript disabled (planner and checker excepted).
