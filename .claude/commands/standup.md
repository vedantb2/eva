Review my git commits from the past workday and generate a standup summary.

## Steps

1. Determine the `--since` value: run `date +%u` to get the day of week (1=Mon, 7=Sun). If today is Monday (1), use `--since="last Friday 00:00"`. Otherwise use `--since="yesterday 00:00"`.
2. Run `git log --author="$(git config user.name)" --since="<value from step 1>" --pretty=format:"%h %s" --no-merges` to get my commits.
3. If there are commits, run `git log --author="$(git config user.name)" --since="<value from step 1>" --no-merges --stat` to understand the scope of changes.
4. Group related commits together by feature/area (don't list every commit individually if they're related).
5. Output a concise standup in this format:

```
## Standup — <today's date>

**Done:**
- <bullet point summarizing a feature/fix/task>
- <bullet point summarizing a feature/fix/task>
```

## Rules

- Keep each bullet to one line, max two sentences.
- Group related commits into a single bullet rather than listing each commit separately.
- Focus on WHAT was accomplished, not HOW (no file names or technical details unless they add clarity).
- If no commits found, say "No commits in the last 24 hours."
- Do not include merge commits.
- Do not include commit hashes in the output.
