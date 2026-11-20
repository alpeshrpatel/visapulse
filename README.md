# VisaPulse

The U.S. Visa Bulletin you can trust and actually read: priority-date cut-offs for every family and
employment preference category, how they moved, and a rule-based planner for the next step.

**Not legal advice.** VisaPulse is an independent information site. It is not affiliated with the U.S.
Department of State or USCIS. Always confirm against the official
[Visa Bulletin](https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html) and
[USCIS](https://www.uscis.gov/visabulletininfo) before acting.

## Commands
```bash
npm ci
npm run dev            # local preview
npm test               # node:test
npm run data:validate  # the data gate
npm run build          # -> dist/ (never committed)
```

## Where the numbers come from
| Folder | What it is |
|--------|------------|
| `data/bulletins/` | **Verified records.** Parsed from the official State Department bulletin page. Each file carries its provenance: the official URL, the Internet Archive snapshot it was read from, and the SHA-256 of the exact bytes parsed. |
| `data/sources/manifest.json` | The snapshot pin and hash for every verified record. |
| `data/visa-bulletins/` | A frozen, third-party compilation kept for history. Used only for months that are not verified yet, always labeled unverified, and never edited (`data/sources/legacy-freeze.json` enforces that). |

The State Department site refuses scripted requests, so the pipeline never contacts it; it reads the
public-domain page from an Internet Archive snapshot, or from a copy a person saved in their browser.
The parser stops on anything it does not recognise rather than guess. Details: `docs/ARCHITECTURE.md`.

```bash
npm run data:add -- 2026-12                    # add a month from its archive snapshot
npm run data:add -- 2026-12 --file saved.html  # or from a browser-saved official page
npm run data:backfill                          # one-time: every month since 2002 (about 20 minutes)
```

## Project docs
`docs/STRATEGY.md` (what and why) · `docs/DECISIONS.md` (decision log) · `docs/STORIES.md` (board) ·
`docs/stories/` (one detailed file per open story; start with its README) · `docs/growth/` (marketing and growth plan) ·
`docs/RUNBOOKS.md` (how to operate) · `docs/LOGBOOK.md` (progress log; resume point for any new session).

## Deploy
Any static host. Build command `npm run build`, output `dist`. Set `SITE_URL` to the public address.
See `docs/RUNBOOKS.md` RB4.
