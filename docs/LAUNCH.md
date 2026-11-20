# Launch and growth kit (S-405). Everything here is prepared; posting, deploying and spending are owner actions.

**After launch, the working plan is `docs/growth/`** (audience and 90-day plan, search plan, channel playbook with the bulletin-day runbook, outreach templates, metrics). This file stays the launch gate and first-posts kit.

## Positioning
- **One line**: The Visa Bulletin you can trust and actually read.
- **Why it is different**: every number links to the official State Department page and the exact archived copy it was read from; unverified data is labeled; nothing is presented as a prediction.
- **Who it is for**: people waiting on a priority date, the employers who sponsor them, and immigration attorneys and paralegals.
- **Do not claim**: predictions, wait-time estimates, legal advice, affiliation with any agency, "real-time" (the bulletin is monthly).

## Gate before any promotion (do not skip)
1. Official backfill done (`npm run data:backfill`) and `docs/data/CROSSCHECK.md` reviewed — promoting a site that is mostly "unverified" wastes the first impression.
2. Brand decision (DECISIONS O3: visapulseusa.com exists) and a domain bought.
3. Deployed with `SITE_URL` set; `/sitemap.xml` and `/feed.xml` resolve.
4. The current month is verified and spot-checked against the official page.

## Phase A — be findable (week 1, free)
- Google Search Console and Bing Webmaster Tools: verify the domain, submit `/sitemap.xml`.
- Check that `/visa-bulletin/<month>-<year>/` and `/priority-dates/eb2/india/` are indexed after about a week; fix anything "Crawled, not indexed".
- Pages built to rank: one per bulletin month ("visa bulletin december 2026"), one per category and area ("EB2 India priority date", "F4 Philippines priority date").

## Phase B — bulletin-day ritual (monthly, about 30 minutes)
The bulletin usually appears between the 8th and the 20th for the following month. Search interest peaks within hours.
1. Merge the data pull request (RUNBOOKS RB2); confirm the home page shows the new month as verified.
2. Post the month's summary (template below) where it is welcome.
3. Answer questions for a day. Corrections beat promotion: if someone finds an error, fix it publicly.

**Post template** (fill from the "What moved" section of the new page):
> [Month Year] Visa Bulletin is out. Final Action Dates: N moved forward, M moved back, K unchanged. Biggest moves: [line area +X], [line area +Y]. Retrogressions: [list or "none"]. Full table with history for each category, verified against the official page: [link]. Not legal advice; confirm on travel.state.gov.

## Phase C — communities (read each community's rules first; several ban self-promotion)
| Where | How to take part | Notes |
|-------|------------------|-------|
| r/USCIS, r/greencard, r/h1b, r/immigration | Answer bulletin questions with the number and the official link; mention the site only where rules allow tools/resources, ideally in a monthly megathread | Disclose that you built it. Never post in threads about someone's personal crisis. |
| Trackitt, Blind (immigration topics) | Same: answer first, link second | Blind users are openly skeptical of naive "wait time" estimators — lead with "no predictions". |
| Hacker News "Show HN" | One post: the data-provenance angle (hash-pinned archive snapshots, parser that refuses to guess) | Technical audience; expect questions about the State Department blocking scripts. |
| LinkedIn | Monthly summary post aimed at HR/mobility and attorneys | Best channel for the employer watchlist later. |

**Show HN draft**
> Show HN: VisaPulse – the U.S. Visa Bulletin with verifiable provenance
> The State Department publishes green-card cut-off dates monthly as HTML tables. Most trackers scrape them (or each other) and add predictions. I rebuilt the dataset from the official pages, pinned each month to an Internet Archive snapshot plus a SHA-256 of the bytes parsed, and wrote a parser that stops instead of guessing. The site is static, no trackers, and labels anything not yet verified. Open JSON/CSV included. Feedback on the data model welcome.

## Phase D — earn links
- Open data page (`/data/`) and CSV: pitch to immigration bloggers, data journalists and researchers who currently hand-copy tables.
- Attorney outreach (template): "We built a free, citable history of every Visa Bulletin cut-off, each tied to the official page. If it is useful for client updates, link to any page; if you spot an error, tell us and we will credit the correction." No referral arrangements (DECISIONS D26, O5).
- Later: embeddable "current cut-off" widget (S-606) for firm blogs.

## Phase E — retain
RSS feed today (`/feed.xml`); email alerts with double opt-in in Phase 4 (S-501…S-503); employer watchlist in Phase 5 (S-602).

## Scale and monetize (after the gate below)
| Trigger | Step |
|---------|------|
| 10k monthly visitors or first inbound sponsor | One labeled flat-fee sponsor slot (S-601), `/advertise/` page with audience facts |
| 1k email subscribers | Monthly digest sponsorship |
| Repeated employer/attorney requests | Paid watchlist or data API decision (S-607) |
| Sustained non-English search traffic | i18n: Spanish, Hindi, Chinese (S-605) |

## What to measure (cookieless analytics, S-403)
Search impressions and clicks per page type · bulletin-day visits · share of returning visitors · checker and planner use · feed subscribers · corrections reported. No vanity metrics; no per-user tracking.

## Owner actions checklist
- [ ] Run the backfill and review the cross-check
- [ ] Decide the name, buy the domain
- [ ] Create the static-host project (Cloudflare Pages or Netlify), set `SITE_URL`, deploy
- [ ] Push the repository (enables CI and the monthly refresh workflow)
- [ ] Search Console + Bing verification, submit sitemap
- [ ] First bulletin-day post
