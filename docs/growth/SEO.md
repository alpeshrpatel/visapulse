# Search plan

Search is the main free channel: people type the same questions every month, and each question can be
answered by a page generated from verified data. This file maps searches to pages, sets the on-page rules,
and lists how links are earned.

**No search volumes are quoted here.** None were measured. Example queries below are illustrations of a
pattern, to be confirmed in Search Console after launch (`METRICS.md`, S-809).

---

## 1. One page type per kind of search

| ID | Page type (URL) | The search it answers (examples of the pattern) | What the searcher must see first | Status / story |
|----|-----------------|--------------------------------------------------|----------------------------------|----------------|
| P1 | Bulletin month `/visa-bulletin/<month>-<year>/` | "visa bulletin december 2026", "december 2026 visa bulletin dates for filing" | The month, both tables, what moved, verified badge | Live. Improve: S-302, S-804 |
| P2 | Category × area `/priority-dates/<cat>/<area>/` | "eb2 india priority date", "f4 philippines priority date today", "eb3 row final action date" | The current date in large type, the month, 1- and 12-month movement | Live. Improve: S-804 (date in the title), S-803 (answers in words), S-305 |
| P3 | Category `/priority-dates/<cat>/` | "eb3 priority dates", "f2a visa bulletin" | Table of all areas for that category | Live |
| P4 | Home `/` | "visa bulletin", "current visa bulletin", brand | Latest month and entry points | Live. Improve: S-211 |
| P5 | Country hub `/country/<area>/` | "visa bulletin india", "philippines priority dates", "priority date rest of world" | Every category for that country in one table | **S-801** |
| P6 | Glossary `/learn/<term>/` | "what is a priority date", "final action date vs date for filing", "what does C mean in visa bulletin" | A two-sentence answer, the official wording, a link to check a date | **S-308, S-802** (need owner review) |
| P7 | Predictions `/learn/visa-bulletin-predictions/` | "visa bulletin predictions", "eb2 india predictions" | Honest answer: nobody knows; here is what happened; here is the official note | **S-805** (needs owner review) |
| P8 | Next bulletin `/next-visa-bulletin/` | "is the january visa bulletin out", "when is the next visa bulletin" | Yes or no, the newest month we hold, the official link, alerts | **S-806** |
| P9 | Checker `/check/` | "is my priority date current", "priority date checker" | The form, then the answer on both charts | Live. Improve: S-303 |
| P10 | Fiscal year `/fiscal-year/<year>/` | "visa bulletin fy 2025", "eb2 india movement 2024" | Start and end of the year per line; months it moved back | S-603 (after S-109) |
| P11 | Compare `/compare/` | "eb2 vs eb3 india priority date" | Both lines on one chart | S-306 |
| P12 | Category guides `/learn/guide-<cat>/` | "what is eb3 other workers", "f2a vs f2b" | The official description and the current cut-offs | S-604 (needs owner review) |
| P13 | How the line works `/learn/how-the-line-works/` | "why is india green card backlog so long", "per country limit green card" | The limits and the per-country rule, quoted | S-702 (needs owner review) |
| P14 | Data and citation `/data/`, `/cite/` | "visa bulletin historical data csv", "visa bulletin dataset" | Download links, licence, schema | Live; S-609, S-808, S-407 |
| P15 | Translated pages `/es/`, `/hi/`, `/zh/` | The same searches in other languages | The same answers, reviewed by a fluent person | S-605 |

**Build order for search:** S-804 → S-803 → S-801 → S-407 → S-806 → S-302 → S-305 → then the reviewed content pages (S-308, S-802, S-805).

### Pages we will not make
- A page per priority date ("priority date January 1 2015 EB2 India") — thousands of near-identical pages with no new
  information. The checker handles this.
- "Wait time" or "how long will I wait" pages. We cannot answer honestly.
- City, state or law-firm pages. Not our subject.
- Pages written to fill space. If a page has no data or official quotation of its own, it should not exist.

---

## 2. On-page rules (every indexable page)

1. **Title** says the answer or the exact subject, with the month where it applies (templates in S-804). One idea per title.
2. **One `<h1>`** that matches the title's subject (the build check enforces a single `<h1>`).
3. **The answer is in the first screen** as text (not only inside a chart): the date, the month, the movement.
4. **Meta description** 50–160 characters, a factual sentence that contains the answer.
5. **Every page links up and across**: breadcrumbs (kicker links), related categories, related areas, the checker.
6. **Every number has its source line** (verified badge, official link, archive snapshot). This is also what makes other sites willing to cite us.
7. **Words people use**: "priority date", "cut-off", "Final Action Date", "Date for Filing", "current", "retrogression",
   the category codes with and without the hyphen ("EB-2" in text; "EB2" appears in URLs), and country names. Use them
   naturally once; do not repeat them to fill a quota.
8. **No copy that could be on any site.** Text on data pages is generated from the data (S-302, S-803).
9. **Addresses never change.** If one must, add a redirect in `public/_redirects` and keep it forever.
10. **Fast and plain**: no script needed to read any indexable page; images only where they carry information.

## 3. Internal linking (hub and spoke)

```
Home ──► latest bulletin tables ──► every category × area page
  │                                         ▲        │
  ├─► Priority dates index ──► category ────┘        ├─► checker (prefilled)
  ├─► Country hubs (S-801) ──► category × area       ├─► same category, other areas
  ├─► Archive ──► each month ──► category × area     └─► same area, other categories + country hub
  └─► Learn (S-802…) ◄── linked from the term where it appears on data pages
```
Rules: every category × area page is at most two clicks from the home page; every new page type gets a link from at
least two existing page types in the same story that creates it; link text names the destination ("EB-2 India history"),
never "click here".

## 4. Bulletin-day search

Interest in "visa bulletin <next month>" is concentrated in the hours after publication *(assumption; verify with the
bulletin-day rows in `METRICS.md`)*. What we control:
1. **Time to a verified page.** The scheduled workflow proposes the data; the owner spot-checks and merges. Aim for the same day.
2. **The page exists at its final address immediately** (it is the same template every month, so it is indexable at once).
3. **Tell search engines**: the sitemap updates on deploy; IndexNow for Bing and others (S-810); in Google Search
   Console, "Request indexing" for the new month's page and the home page (owner, 2 minutes).
4. **The home page title carries the month** (it already does).
5. Before the bulletin: `/next-visa-bulletin/` (S-806) answers "is it out?" truthfully and offers alerts.

## 5. Earning links (the only kind we want)

| Asset | Who has a reason to link | How they find out |
|---|---|---|
| Category × area history pages with charts | Attorney blogs writing the monthly update; forum regulars answering "has it ever moved back?" | Outreach template A; answering in communities |
| Embeddable cut-off card (S-606) | Firm sites and bloggers who want a number that updates itself | Outreach template A, "Embed this" on every page |
| Open data: CSV + JSON + schema (S-609) | Researchers, journalists, developers, students | `OUTREACH.md` §5–6, Show HN, dataset listings |
| "Cite this page" (S-808) and the fact sheet | Anyone who needs a citable source for a past cut-off | Present on every page |
| Changelog of corrections (S-608) | People writing about data quality; it is also the proof behind our claim | Linked in the footer |
| Explainers that quote the official text (S-802, S-702) | University international offices' resource pages, HR knowledge bases | Outreach template D |
| The provenance method (hash-pinned snapshots, a parser that refuses to guess) | Technical audiences | Show HN draft in `docs/LAUNCH.md` |

Not acceptable: buying links, "guest post" exchanges, directory spam, comment links, adding our own link to Wikipedia
(suggest it on an article's talk page instead and let editors decide).

## 6. Finding what people actually search (no paid tool needed)

1. **After launch, Search Console is the source of truth.** Monthly: `npm run growth:report` (S-809). The "easy wins"
   list (queries where we rank 5–20) decides the next page improvements.
2. **Before launch, by hand, 30 minutes:** type the start of a query into a search engine and write down the suggestions
   ("visa bulletin …", "eb2 india …", "priority date …", "f2a …"); note the "People also ask" questions; note the titles
   of the top five results. Put the list in `docs/growth/reviews/pre-launch-queries.md`. This tells us wording, not volume.
3. **Community titles are free research:** the titles of new threads on bulletin day are the questions in people's own words.
4. Paid tools (Ahrefs, Similarweb) are optional. If the owner connects one, add volumes to the table in §1; do not block on it.

## 7. Technical checklist (run monthly; details in RUNBOOKS RB10 once S-409 lands)

- [ ] Sitemap fetched successfully; submitted count ≈ built page count
- [ ] Indexed pages rising or steady; top "not indexed" reason reviewed
- [ ] No page with a canonical pointing to a different host
- [ ] `robots.txt` allows all and names the sitemap
- [ ] The newest bulletin page is indexed within a few days of publication
- [ ] Core pages load without script errors on a phone (spot check three)
- [ ] No two pages share a title (the S-804 test guards this at build time)
- [ ] Structured data has no errors in Search Console's enhancement reports (after S-407)

## 8. Other languages
Translate only after English pages are stable and Search Console shows impressions from a country where another
language dominates. One language at a time, with a fluent reviewer (S-605). A translated legal caution that is wrong is
worse than an English one that is right.

## 9. Risks specific to search
| Risk | What we do |
|---|---|
| A large site copies the page-per-category idea | We keep the parts that are hard to copy: provenance on every month, corrections log, no predictions, speed on bulletin day |
| Search engines treat hundreds of similar data pages as thin | Each page carries unique data, a chart, generated sentences and history; no filler pages (§1 "will not make") |
| Search results answer the question directly (an AI summary or a featured snippet) and send no visit | Be the source that is cited: clear answers in text, citable pages, open data. Measure impressions as well as clicks |
| The brand name collides with visapulseusa.com (DECISIONS O3) | Decide the name before any promotion; a rename after links exist is expensive |
| A wrong number gets indexed and shared | Verified-only posting, the freshness guard (S-111), public corrections (S-608) |
