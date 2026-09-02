/** Prompt for the `daily-standup` catalog entry. */
export const DAILY_STANDUP_PROMPT = `Write the daily standup: a short, friendly summary of what changed in this app since the last working day, written for the people who use it.

Gather the raw material with git. Cover everything since the previous working day: \`git log --since='36 hours ago' --pretty=format:'%h %ad %s' --date=short\`, but on a Monday use \`--since='4 days ago'\` so Friday and the weekend are included. If the window is empty, use the most recent day that has commits and say which day you covered. Read the diffs of the commits that matter, so you can describe what they changed for a user.

The audience is non-technical. They care about what they can now do, what got faster, and what got fixed. They do not care about how it was built.

Rules:
- Start with one bold line summarising the day in plain language
- Group the changes under whichever of these \`###\` headings apply: New, Faster, Fixed, Improved
- Write each change as one plain-language sentence about what is different for the user, and be specific about the benefit
- No jargon, no file or function names, no commit hashes, no architecture or implementation detail
- Skip anything with no user-facing impact: refactors, dependency bumps, tests, formatting, merge commits
- If something needs a teammate's attention (a revert, a hotfix, a breaking change), end with a single **Heads up:** line
- Keep the whole deliverable under ~150 words

If nothing user-facing shipped, the deliverable is the single line: \`No user-facing changes since the last working day.\``;
