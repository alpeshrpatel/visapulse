# Channels: communities, social, and bulletin day

Agents draft; **the owner posts**, from the owner's own real account, and says "I built this".
Every community has its own rules about links and self-promotion, and they change. **Read the rules page on the
day you post.** Nothing below is a statement of any community's current rules.

Where people gather is an assumption until the referrer data says otherwise (`METRICS.md`).

---

## 1. Channel by channel

| Channel | Who is there | How to take part | Cadence | Never |
|---|---|---|---|---|
| **Reddit**: r/USCIS, r/greencard, r/h1b, r/immigration, and category subreddits (EB-2 NIW, EB-5) | Applicants asking and answering daily; bulletin-day megathreads | Two weeks of answering questions with the number and the **official** link before any link to us. On bulletin day, post in the megathread if one exists, or one post where the rules allow tools. Use the "community" text from `npm run bulletin:post`. | Bulletin day + answering through the month | Post the same text in several subreddits the same day; link in threads about a personal crisis; argue with moderators |
| **Team Blind** (immigration topics) | Tech workers on H-1B; sceptical of estimators | Lead with "no predictions, every number checked against the official page". Answer movement questions with history from the category page. | Bulletin day | Anything that sounds like marketing copy |
| **Trackitt, immihelp and similar forums** | Long-time trackers of individual cases | Answer in existing bulletin threads; link the specific category × area page, not the home page | Bulletin day | Start promotional threads |
| **WhatsApp, Telegram, WeChat groups** | Small groups in the same line; the highest-trust channel | **We do not enter groups.** Members carry us in: "Copy as text" (S-807) and link previews (S-404) are the whole strategy. If the owner is personally in such a group, share once per bulletin, as a member. | – | Join groups to post; ask for group invitations |
| **Facebook groups** (Philippines family and nurse groups; Mexico family groups; nationality groups) | Family-category applicants; many on phones | Same "answer first" approach; the country hub (S-801) is the page to link. Spanish groups only after Spanish pages exist (S-605). | Bulletin day | Post in a language the page does not support |
| **LinkedIn** | HR, mobility managers, attorneys, paralegals | One post per bulletin from the owner's profile: what moved, in three lines, plus the link. Later: the watchlist (S-602). Comment helpfully on attorneys' bulletin posts without linking. | B + 3 days | Tagging people who did not ask |
| **X, Bluesky, Mastodon, Threads** | Attorneys, journalists, policy people | The "short" text on bulletin day. Reply to people asking "is it out?" with the official link first. | Bulletin day | Hashtag strings; threads longer than three posts |
| **YouTube** | Creators who make a monthly bulletin video | We do not make videos. We offer creators charts and data to show on screen with credit (`OUTREACH.md` template B). | Outreach, quarterly | Commenting links under their videos |
| **Hacker News** | Developers; many are on visas themselves | One "Show HN" about the provenance method (draft in `docs/LAUNCH.md`). Be present for the whole day to answer. | Once; again only for a substantial new thing (open data API, the watchlist) | Reposting; asking for votes |
| **Quora and similar Q&A sites** | People searching for definitions | Low priority. If used: answer evergreen questions ("what is a priority date") fully, cite the official text, link an explainer once it is reviewed. | Occasional | Copy-pasting the same answer |
| **Newsletters and podcasts about immigration or HR** | Engaged readers | Outreach only (`OUTREACH.md`). Offer the monthly summary text for reuse with credit. | Quarterly | Paying for placement before the sponsor/ad policy is decided |
| **Chinese-language forums and WeChat** | The China EB audience | Do nothing until Chinese pages are reviewed (S-605) and a fluent person is willing to take part as themselves. | Later | Machine-translated posts |
| **Our own channels**: feed (`/feed.xml`), `/alerts/`, later email | People who already chose us | Keep the promise: one item per bulletin, nothing else. | Every bulletin | Marketing emails; "we miss you" messages |

### The "answer first" standard
A good reply looks like this, with or without a link to us:
> EB-3 India Final Action is **<date>** in the <Month Year> bulletin, moved <label> from last month. Dates for Filing is
> <date>. Official bulletin: <travel.state.gov link>. (I keep a history of every month for this category here: <link> — I built it.)

A reply that is only a link is spam, even when the link is useful.

---

## 2. Bulletin-day runbook (the most valuable hour of the month)

Preparation the day before: `npm run check` green; the previous month verified; drafts folder empty; you know which
communities allow what.

| Step | Action | Check |
|---|---|---|
| 1 | The scheduled workflow opens a data pull request, or run `npm run data:add -- <YYYY-MM>` (RUNBOOKS RB2). If the archive has no copy yet, save the official page from a browser and use `--file`. | A record exists in `data/bulletins/` |
| 2 | **Spot-check three cells** against the official page: one family, one employment, one Dates for Filing. | They match exactly |
| 3 | Merge and deploy. Open the live home page. | New month shown, "Verified" badge |
| 4 | `SITE_URL=<site> npm run bulletin:post` (S-406). Read the output once against the page. | Counts match the "What moved" section |
| 5 | Post, in this order, spacing them out: (a) the megathread or main community where rules allow; (b) the short text on X/Bluesky/Mastodon; (c) the messaging text to any group **you are already a member of**. | Each logged in `METRICS.md` posting log |
| 6 | Search engines: Search Console → request indexing for the home page and the new month's page; IndexNow dry run then send (S-810). | Done |
| 7 | Stay for questions for the rest of the day. Reply with numbers and official links. | Every direct question answered |
| 8 | If anyone reports a wrong number: check it immediately against the official page. If they are right: fix, redeploy, reply "you are right, fixed, thank you", add a changelog entry (S-608). | Correction public within the hour |
| 9 | Next day or when USCIS posts it: enter the chart designation (S-303), redeploy, one short follow-up where it was asked about. | Entry has the USCIS source link |
| 10 | B + 3: the LinkedIn post. B + 7: fill the month's metrics row. | Row filled |

**If the bulletin is not verified yet when others are already posting:** do not post numbers. It is fine to reply
"it is out: <official link>" and add our link later. Being second and right is the brand.

**If the bulletin has a large retrogression:** people will be upset. Post the facts only. No commentary, no "sorry",
no speculation about causes or recovery.

---

## 3. Text bank

Fill the brackets from the page or from `npm run bulletin:post`. Do not add adjectives.

### 3.1 Community post (megathread comment or stand-alone where allowed)
```
<Month Year> Visa Bulletin is out.
Final Action Dates vs <Previous Month Year>: <A> moved forward, <R> moved back, <U> unchanged.
Biggest advances: <line> <label>; <line> <label>; <line> <label>
Moved back: <line> <label>; … (or: none)
<Became Current / Unavailable lines, if any>
Full tables with the history of every category, each number checked against the official page: <link>
I built this site. Not legal advice; confirm on travel.state.gov.
```

### 3.2 Short (X, Bluesky, Mastodon, Threads)
```
<Month Year> Visa Bulletin: <A> categories moved forward, <R> moved back, <U> unchanged (Final Action Dates).
Full tables + history: <link>
```

### 3.3 LinkedIn (B + 3)
```
The <Month Year> Visa Bulletin has been published.

Final Action Dates compared with <Previous Month Year>: <A> category-and-country lines moved forward, <R> moved back, <U> did not move. <One factual sentence about the largest change, with the dates.>

For HR and mobility teams: every category's table and month-by-month history, each number checked against the State Department's page, is at <link>. It makes no predictions. I built it; corrections are welcome.
```

### 3.4 Messaging groups (as a member, once)
```
<Month Year> Visa Bulletin is out. <code> <area>: Final Action <date> (<label> vs last month), Date for Filing <date>.
All categories + history: <link>  (not legal advice)
```

### 3.5 Reply to "did X move?"
```
<code> <area> Final Action: <old> → <new> (<label>). Dates for Filing: <old> → <new>.
Official bulletin: <travel.state.gov link>
History for this category (I built this): <category × area link>
```

### 3.6 Reply to "when will my date be current?"
```
Nobody outside the State Department can know that, and I would distrust any site that gives a date.
What can be known: the cut-off is <date> now; over the last 12 months it moved <label> (history, not a forecast).
You can check your date against both charts here: <checker link>. For anything about your own case, ask your attorney.
```

### 3.7 Correction
```
You are right, thank you. <What was wrong> for <Month Year>; the official page says <value>. Fixed and listed in our changelog: <link>.
```

### 3.8 Show HN follow-up comment (for questions about scraping)
```
The State Department's site refuses scripted requests, so the pipeline never contacts it. It reads each page from an
Internet Archive snapshot (or a copy a person saved), records the snapshot timestamp and a SHA-256 of the bytes, and
the parser stops on any row or cell it does not recognise instead of guessing. Each record carries that provenance.
```

---

## 4. Tagging links so we can tell what worked
Add `?ref=<channel>-<yyyymm>` to links you post (for example `?ref=reddit-202612`, `?ref=linkedin-202612`,
`?ref=wa-202612`). It carries no personal information; the canonical link keeps search engines pointed at the clean
address; cookieless analytics can group visits by it. Messaging apps hide the referrer, so this tag is the only way to
see group-chat traffic. Never put anything about a person in a link.

## 5. Etiquette checklist before every post
- [ ] The month is verified and deployed
- [ ] I read this community's rules today
- [ ] The post contains the numbers and the official link, not only our link
- [ ] It says I built the site
- [ ] No prediction, no advice, no adjective
- [ ] Not a personal-crisis thread
- [ ] Logged in the posting log
