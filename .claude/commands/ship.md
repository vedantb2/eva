---
model: haiku
---

Stage relevant files, commit, and push to remote.

1. Run `git status -u` and `git log --oneline -5` in parallel
2. Identify session-related files, excluding pre-existing dirty files
3. Stage with `git add` using specific paths (never `git add -A` or `.`)
4. Write commit message following repo convention (lowercase prefix: feat/fix/refactor) — summarize WHY, not WHAT
5. Commit with HEREDOC, then `git push`
6. Print commit hash and summary
