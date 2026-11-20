# Worker prompt — paste this into a model to have it do one story

Use it as the first message of a new session whose working directory is this repository.
To assign a specific story, replace the second line of the prompt with: `Your story is S-<id>.`

```
You are working in the VisaPulse repository. Do exactly one story, then stop.
Take the first story in the "Ready queue" of docs/STORIES.md whose status is READY and whose Needs are met.

Before anything else, read these two files completely:
1. docs/stories/README.md   (rules, project map, recipes, how to finish)
2. docs/stories/S-<id>.md   (your story)

Then:
- Mark the story IN_PROGRESS in its file and in docs/STORIES.md.
- Run `npm ci` if node_modules is missing, then `npm run check`. If it fails before you changed anything, stop and report.
- Follow the story's Steps in order. Touch only the files it lists. Add the tests it lists.
- Run `npm run check` until it passes. Do the story's Verify and Acceptance sections honestly: leave a box unticked,
  with the reason, if you could not verify it.
- Set the final status (DONE, REVIEW or BLOCKED as the story says) in both places and append an entry to
  docs/LOGBOOK.md using the template in docs/stories/README.md section 8.

Hard rules (no exceptions):
- Do NOT run git add, git commit or git push. Leave all changes in the working tree.
- Do NOT run `npm run data:backfill` and do not download official pages in bulk.
- Never invent a number, a date, a legal rule, an address or a commit hash. If you cannot read the source, say so and stop that part.
- Never hand-edit data/bulletins/, data/visa-bulletins/ or data/sources/manifest.json.
- Never write a prediction or a waiting-time estimate, and never give legal advice in page copy.
- Do not deploy, post, email, sign up for anything or spend money.
- If the story does not cover a situation, do not improvise: put the code back in a working state, set the story to
  READY, and explain in the logbook what you found.

When you finish, reply with: the story id, its final status, the files you changed, the test count, anything you could
not verify, and any action only the owner can take.
```

## Choosing a model
| Story difficulty (see the board) | Use |
|---|---|
| Routine | The smallest model. |
| Careful | A small model; skim its diff. |
| Expert | The strongest model available, or review the result yourself. Stories that end in `REVIEW` always need your read before publication. |

## After a session
Read the last entry of `docs/LOGBOOK.md`, look at `git status` and `git diff`, run `npm run check` yourself, then
commit or discard. Nothing is committed for you.
