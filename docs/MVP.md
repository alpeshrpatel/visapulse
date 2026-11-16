# MVP roadmap (high level). Each MVP is deployable and tested before the next starts.

**Product**: the Visa Bulletin you can trust and actually read. See docs/STRATEGY.md.

| MVP | Phase name | Stories | Exit criteria |
|-----|-----------|---------|---------------|
| 0 | **Foundation** | S-101…S-107 | Official parser + validator + provenance in place; dataset layer prefers official records and labels the rest; no personal email in code; CI defined; `npm run check` green |
| 1 | **Static site** | S-201…S-209 | Every bulletin month and category × area has its own HTML page; planner works; trust pages, SEO, RSS, open data live; SPA removed; bulletin-page JS < 15 kB gz |
| 2 | **Tools** | S-301…S-306 | Priority-date checker, monthly summaries, USCIS chart designation, pace history, compare |
| 3 | **Launch and advertise** | S-401…S-406 | Deploy config, monthly automation, analytics, social cards, launch kit; owner deploys and posts |
| 4 | **Alerts** | S-501…S-503 | Double-opt-in email alerts sending after a real bulletin |
| 5 | **Scale and monetize** | S-601…S-607 | Sponsor slot, employer watchlist, FY pages, explainers, i18n, embed; Pro decision from data |

## Definition of done (every story)
Tests added or updated · `npm run check` green · no secrets or personal data in code · story status flipped · docs/LOGBOOK entry appended.

## Release gates
- **Data gate**: a period is "verified" only when parsed from an official page whose snapshot hash is in `data/sources/manifest.json` and the validator passes.
- **Honesty gate**: any forward-looking number is labeled as historical pace; every page carries the disclaimer and an official link.
- **Owner gate**: push, deploy, posting, email sending, spending — owner only (listed under "Owner actions" in the logbook).

## Non-goals
Accounts, legal advice, USCIS case-status tracking, chatbots, predictions presented as fact, native apps, paywalls on core data.
