# Outreach: partners, creators and the press

Outreach means the owner writing **one person at a time**, with something useful for that person's readers.
It is slow, and it is how the durable links are earned (loop 4 in `README.md`).

## 1. Ground rules
1. **Hand-built lists only.** Find each contact on the person's or firm's own public page, where they invite business
   contact. No scraped lists, no purchased lists, no guessing addresses.
2. **One email, one follow-up after a week, then stop.** Anyone who says no or does not reply is left alone.
3. **Small batches**: at most ten new contacts a week. Each email names something specific about their work.
4. **Identify yourself** (name, the site, that you built it). Offer an easy "no thanks". Honour it permanently.
   *(Commercial email rules such as CAN-SPAM in the U.S. also expect an accurate sender and a postal address in
   commercial messages; if in doubt about what applies to you, ask a lawyer.)*
5. **Offer, do not ask.** The first email gives something (a chart, an embed, a dataset). It does not ask for a link.
6. **No payment, no swaps, no referral arrangement** (D26, O5). If someone offers one, decline and log it.
7. **The owner sends.** Agents may draft and keep the tracking sheet, never send.

## 2. What we have to offer (build these before the matching outreach)
| Asset | Story | Good for |
|---|---|---|
| Category × area history page with a chart, free to reuse with a link | live | Attorneys, bloggers, creators |
| Embeddable cut-off card that updates itself | S-606 | Firm sites, blogs |
| "Cite this page" text and a fact sheet | S-808 | Attorneys, journalists, students |
| Open data: CSV, JSON per month, schema, stability promise | live + S-609 | Researchers, journalists, developers |
| Monthly summary text, reusable with credit | S-302, S-406 | Newsletters, creators |
| Watchlist (many dates at once, nothing uploaded) | S-602 | HR, mobility teams, paralegals |
| Explainers that quote the official text | S-308, S-802, S-702 (after owner review) | University offices, HR knowledge bases |
| Public corrections log | S-608 | Anyone deciding whether to trust us |

## 3. Who to contact, in order

| Order | Segment | Why they care | Where to find them | Offer | Template |
|---|---|---|---|---|---|
| 1 | **Solo and small-firm immigration attorneys who blog the bulletin monthly** | They rewrite the same tables by hand each month | Search the latest bulletin month + "visa bulletin" and read past the big firms; firm blog pages list an editor or a contact form | History chart to illustrate their post; embed card; cite text | A |
| 2 | **Immigration YouTubers and bloggers** | They need accurate visuals quickly on bulletin day | Their channel "About" page or site contact | Charts and tables free to show with credit; a heads-up when our verified page is live | B |
| 3 | **HR and global-mobility practitioners; mobility newsletters** | Monthly "who became current?" chore | LinkedIn posts about the bulletin; newsletter mastheads | Watchlist; the LinkedIn summary | C |
| 4 | **University international student and scholar offices** | They maintain "resources" pages for scholars and staff on employment-based paths | The office's resources page lists a webmaster or general address | Explainers and the checker, with the no-predictions stance | D |
| 5 | **Researchers, think tanks and data journalists covering the backlog** | They need historical cut-offs in machine-readable form | Author pages on reports and articles about visa backlogs | Open data, schema, method; offer to answer questions | E |
| 6 | **Developers and open-data listings** | Reuse | Dataset directories and "awesome" lists that accept public-domain data; the Show HN thread | Data address, schema, licence statement | F |
| 7 | **Nurse-recruitment and staffing agencies (Philippines EB-3)** | Their candidates ask about EB-3 dates constantly | Agency resource pages | Country hub and EB-3 pages; embed card | A (adapted) |
| 8 | **EB-5 writers and newsletters** | Four EB-5 lines by country are hard to follow | Newsletter mastheads | EB-5 pages, embed card | A (adapted) |
| Later | **Sponsors** | Reach this audience without tracking | Only inbound at first (trigger in `docs/LAUNCH.md`) | `/advertise/` page (S-601) | – |

Not on the list, on purpose: bar associations and attorney membership bodies (members-only channels); government
offices; anyone whose business is selling predictions.

## 4. Tracking sheet
Keep `docs/growth/outreach-log.md` (or a private spreadsheet if it will hold personal contact details — **do not commit
personal email addresses to the repository**). Columns:

| Date | Segment | Site or channel (no personal address) | What was offered | Sent by | Reply | Follow-up date | Outcome (link / embed / no / silent) |
|---|---|---|---|---|---|---|---|

Review it at each 30-day review. If one template gets no replies after twenty sends, rewrite it before sending more.

## 5. Templates
Short, specific, easy to refuse. Replace every bracket. Delete any sentence that is not true for that person.

### A. Attorney or agency blog
```
Subject: A history chart for your <Month> Visa Bulletin post

Hello <name>,

I read your <Month Year> bulletin update on <firm blog>. I built VisaPulse, a free site that keeps every Visa Bulletin
cut-off since 2002, each checked against the State Department's page, with a chart for every category and country.

If it helps your readers, you are welcome to use any chart or table with a link, for example <category × area link>.
There is also a small card you can embed that updates itself each month: <link to the "Embed this" section>.

It makes no predictions and gives no legal advice, and it sells nothing. If you ever spot a number that differs from
the official bulletin, I would be grateful to hear it; corrections are listed publicly.

No reply needed, and I will not write again unless you do.

<Your name>
<site>
```

### B. Creator (video or blog)
```
Subject: Verified bulletin tables you can show on screen

Hello <name>,

Your monthly Visa Bulletin videos are where a lot of people first hear the news. I built VisaPulse: the bulletin's
tables and each category's history as charts, every number checked against the official page.

You are welcome to show any chart or table in a video, with credit. On bulletin day the verified page is usually live
within <state what is true: e.g. "the same day">: <link to the latest bulletin page>.

The site makes no predictions. If that is useful, great; if not, no need to reply.

<Your name>
```

### C. HR or mobility
```
Subject: Checking many priority dates at once after each Visa Bulletin

Hello <name>,

After each Visa Bulletin, someone has to check every sponsored employee's priority date against the new cut-offs.
I built a free page that takes a list (reference, category, country, priority date) and shows who is current on each
chart and who changed since last month: <watchlist link>. The list stays in the browser; nothing is uploaded.

It is information only, not legal advice, and counsel should confirm before anyone files. If it saves your team time,
I would value hearing what is missing.

<Your name>
```
(Do not claim conversations, customers or usage numbers you do not have.)

### D. University international office
```
Subject: A plain-language Visa Bulletin resource for your scholars page

Hello,

Your office's resources page for scholars and staff pursuing permanent residence links to the State Department's Visa
Bulletin. I built a free companion that may help readers use it: the same official numbers in a readable form, a
checker for a priority date against both charts, and short explanations that quote the official text:
<link>.

It makes no predictions, gives no legal advice, has no advertising aimed at students and collects no personal data.
If it meets your standards for the resources page, please consider it; if not, thank you for your time.

<Your name>
```

### E. Researcher or journalist
```
Subject: Machine-readable Visa Bulletin cut-offs since 2002, with provenance

Hello <name>,

Your <report/article> on <topic> used Visa Bulletin cut-off dates. In case it saves you time in future work: I have
published every month since 2002 as JSON and one CSV, each month tied to the official page, an archived copy and a
SHA-256 of the bytes parsed. Format and method: <data page link> and <methodology link>.

It is free to use; the underlying figures are public domain. I am glad to answer questions about gaps or method.

<Your name>
```

### F. Dataset listing or developer community
```
Title: U.S. Visa Bulletin cut-off dates, 2002–present (JSON + CSV, public domain data, per-month provenance)
Body: One JSON file per bulletin month and a single CSV of every cut-off (period, group, category, chart, area, value).
Each month records the official URL, the Internet Archive snapshot it was read from and the SHA-256 of the parsed
bytes. Schema: <schema link>. Method: <methodology link>. Maintainer: <name>, corrections welcome.
```

### G. Thank-you for a correction
```
Thank you. You were right: <what>. It is fixed, and the correction is listed here: <changelog link>.
May I credit you by name or handle there? If I do not hear back I will leave it uncredited.
```

## 6. Data stories (one a quarter, after the backfill)
A short, factual piece built from our own verified data gives journalists and bloggers something to cite.
Every figure must be computed by a script from `data/bulletins/` and reproducible; none from unverified months.
Candidates:
- For each category and country: how many months since 2002 the Final Action Date moved backwards.
- The longest runs without any movement.
- Which categories were Current in the first month on record and are not now.
- What happened to each line in the October bulletin of every fiscal year (the start-of-year reset).
- How often the Dates for Filing chart was ahead of Final Action by more than a year, by category.
Format: one page under `/learn/` (through the explainer framework, so it is reviewed before publication), one chart,
one table, the method in two sentences, and the CSV. No forecast drawn from it.

## 7. If someone important links to us
Do nothing special. Do not add "as seen in" badges. Make sure the linked page is still correct, and note the link in
the 30-day review.
