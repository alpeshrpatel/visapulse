# Metrics: what to measure and how to decide

Measurement here is aggregate and cookieless. We never track an individual, never record what someone types into
the checker, planner or watchlist, and never put a priority date into a URL query, an event or a log.

Nothing is measured yet (the site is not deployed). The thresholds below are **starting rules for making decisions,
not forecasts**. Replace them with our own baselines at the 30-day review (S-410).

## 1. The one number
**Bulletin-day returning visitors**: people who come on the day a bulletin is published (or the two days after) and
have visited in an earlier month. It measures the product's promise — "this is where I check each month" — and it
rises only if both the pages and the reminders work. Until analytics can show returning visitors, use the proxy:
bulletin-day visits arriving **directly or from the feed** (no search, no post).

## 2. What to record, and where it comes from

| Stage | Metric | Source | Why it matters |
|---|---|---|---|
| Discover | Pages indexed ÷ pages in the sitemap | Search Console → Pages | Unindexed pages cannot be found |
| Discover | Impressions, clicks, click-through rate and average position, **by page type** | Search Console export → `npm run growth:report` (S-809) | Shows which page templates work |
| Discover | Visits by referrer and by `ref` tag | Analytics (S-403) | Which community or outreach brought people |
| First answer | Visits to category × area pages and `/check/` as a share of all visits | Analytics | Are people reaching their own line? |
| Return | Bulletin-day visits ÷ average daily visits | Analytics | The monthly habit |
| Return | Feed subscribers (if the host or a feed service reports it); confirmed email subscribers (after S-503) | Host / email provider | Reach that does not depend on posting |
| Share | Visits with `ref=wa-…` or other messaging tags; visits to `/check/` with no referrer | Analytics | Group-chat sharing |
| Link | New referring sites | Search Console → Links | Loop 4 |
| Trust | Corrections reported and corrections confirmed | Feedback form, replies, `data/changelog.json` | The reason to choose us |
| Health | Days from official publication to our verified page | Logbook / manifest `addedOn` (S-806) | Bulletin-day speed |
| Health | `npm run check` green on the default branch; freshness guard (S-111) | CI | Nothing matters if the data is stale |

Not measured, on purpose: individual journeys, time on page, scroll depth, heat maps, anything requiring a cookie.

## 3. Starting decision rules

| Signal (at the 30-day review unless stated) | If true, do this |
|---|---|
| Fewer than half of sitemap pages are indexed | Investigate before any other growth work: check "not indexed" reasons, internal links, duplicate titles (S-804) |
| Category × area pages get impressions but a low click-through rate compared with bulletin pages | Rewrite titles/descriptions (S-804); add the answer text (S-803) |
| Many impressions for country-only queries | Build or improve country hubs (S-801) |
| Many impressions for "predictions" queries | Review and publish the predictions page (S-805) |
| Many impressions for "is it out / when" queries | Ship the next-bulletin page (S-806) |
| Bulletin-day visits are less than twice a normal day | The bulletin-day routine is not reaching people: review the posting log, move faster, improve link previews (S-404) |
| Bulletin-day visits are high but next month's direct/feed visits are flat | People are not returning: make alerts visible (S-504), then email (S-501…S-503) |
| A community post brought visits but no later return | Keep answering there; do not increase posting |
| An outreach template has no replies after twenty sends | Rewrite it (`OUTREACH.md` §4) |
| A correction was reported | Same day: verify, fix, changelog entry, thank the reporter |
| Non-English countries produce a meaningful share of impressions | Start S-605 for that language; find a reviewer |
| The watchlist page gets repeated visits from the same referrers (company domains, LinkedIn) | Prepare S-607 |

"Low", "many" and "meaningful" are judged against our own other page types and previous months, not against outside
benchmarks. Write the comparison down when you use one.

## 4. Monthly table (one row per bulletin; append, never rewrite)

| Bulletin | Published → verified page live (days) | Pages indexed / in sitemap | Search clicks (28 d) | Search impressions (28 d) | Bulletin-day visits | Average daily visits | Direct + feed visits on bulletin day | Feed / email subscribers | New referring sites | Corrections confirmed | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| _example: 2027-01_ | _0_ | _– / –_ | _–_ | _–_ | _–_ | _–_ | _–_ | _–_ | _–_ | _0_ | _first month live_ |

Write `–` for a value that was not available. Do not estimate.

## 5. Posting log (every public post or outreach batch)

| Date | Channel and place | What was posted (which template) | Link tag (`ref=`) | Result after 7 days (visits, replies, removed?) |
|---|---|---|---|---|

## 6. Experiment log
One change at a time where possible. An experiment without a written expectation is just a change.

| Date | Change (story or edit) | Expectation, written before | Metric and where it is read | Result (date read) | Keep / revert / follow-up |
|---|---|---|---|---|---|

## 7. Review rhythm

| When | What | Output |
|---|---|---|
| B + 7 each month | Fill the monthly table row; skim the posting log | Row added |
| Monthly, after an export | `npm run growth:report -- docs/growth/exports/<folder>` (S-809) | Report saved under `docs/growth/reviews/` |
| Day 30 after launch | Full review (S-410) | `docs/growth/reviews/<YYYY-MM>-30-day.md`, next three stories |
| Quarterly | Re-read `README.md` §2 (audience) and §7 (themes) against the numbers; update what the data contradicts, with the date | Dated edits in this folder |

## 8. Files in this folder that hold data
- `exports/` — Search Console and analytics exports. Ignored by git (S-809 adds the ignore rule); they can contain
  query strings the owner may not want public.
- `reviews/` — written reviews and reports. Committed. Aggregates only.
- `outreach-log.md` — no personal email addresses (see `OUTREACH.md` §4).
