# MVP roadmap (high level). Each MVP is deployable and tested before the next starts.

**Product**: the Visa Bulletin you can trust and actually read. See docs/STRATEGY.md.
Board: `docs/STORIES.md`. One detailed file per open story: `docs/stories/` (start with its README). Growth plan: `docs/growth/`.

| MVP | Phase name | Stories | Exit criteria | State (2026-11-16) |
|-----|-----------|---------|---------------|--------------------|
| 0 | **Foundation** | S-101…S-112 | Official parser, validator and provenance in place; every month since 2002 verified or listed as unparsed with a reason; legacy fallback retired; freshness guard; CI defined | Core done (S-101…S-107). Waiting on the owner's backfill, then S-108, S-109 |
| 1 | **Static site** | S-201…S-212 | Every bulletin month and category × area has its own HTML page; planner works; trust pages, SEO, feed, open data live; SPA removed; accessibility and performance audit logged | Shipped (S-201…S-208). Audit S-209 in progress |
| 2 | **Tools** | S-301…S-308 | Priority-date checker, plain-English monthly summary, USCIS chart designation, planner polish, pace history, compare, share and print | Checker shipped (S-301) |
| 3 | **Launch and advertise** | S-401…S-410 | Deploy config, monthly automation, analytics, social cards, structured data, launch kit; owner deploys, verifies search consoles and posts; 30-day review | S-401, S-402, S-405 done |
| 4 | **Alerts and retention** | S-501…S-505 | Follow-by-feed page; double-opt-in email alerts sending after a real bulletin; compliance pack | Open (email parts need owner accounts) |
| 5 | **Scale and monetize** | S-601…S-609 | Sponsor slot, employer watchlist, fiscal-year pages, category guides, languages, embed card, changelog, paid-tier decision from data | Open |
| 6 | **Insight** | S-701…S-706 | Source study, "how the line works", official link-outs, then demand and usage data ingested with the same provenance discipline | Open |
| 7 | **Growth engineering** | S-801…S-810 | Country hubs, answers in words, search-ready titles, next-bulletin page, share kit, citations, search report, IndexNow; plan in `docs/growth/` | Open (added 2026-11-16) |

## Definition of done (every story)
Tests added or updated · `npm run check` green · no secrets or personal data in code · story status flipped · docs/LOGBOOK entry appended · **changes left uncommitted for the owner to review** (owner instruction 2026-11-16).

## Release gates
- **Data gate**: a period is "verified" only when parsed from an official page whose snapshot hash is in `data/sources/manifest.json` and the validator passes.
- **Honesty gate**: any forward-looking number is labeled as historical pace; every page carries the disclaimer and an official link.
- **Owner gate**: commit, push, deploy, posting, email sending, spending, and the bulk data backfill — owner only (listed under "Owner actions" in the logbook).

## Non-goals
Accounts, legal advice, USCIS case-status tracking, chatbots, predictions presented as fact, native apps, paywalls on core data.
