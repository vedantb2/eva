---
model: haiku
---

Commit ONLY already-staged changes and push to the remote.

CRITICAL: Do NOT run `git add`, `git add -A`, `git add .`, or stage any files. Only commit what is already in the staging area.

Steps:

1. Run `git diff --cached --stat` to review what's staged
2. If nothing is staged, stop and tell the user — do NOT stage files yourself
3. Run `git log --oneline -5` to see recent commit message style
4. Write a commit message following the repo's convention (lowercase prefix like `feat:`, `fix:`, `refactor:`, etc.) — short title summarizing the WHY, not the WHAT
5. Commit using a HEREDOC for the message (do NOT use `git add` before committing)
6. Push to the remote with `git push`
7. Print the resulting commit hash
