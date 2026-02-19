---
model: haiku
---

Stage all relevant files, commit, and push to remote in one go.

Steps:

1. Run `git status -u` to see all modified, deleted, and untracked files
2. Identify which files are related to the work done in this conversation — exclude files that were already dirty before the conversation started or are unrelated
3. Stage them with `git add` using specific file paths (never use `git add -A` or `git add .`)
4. Run `git diff --cached --stat` to review what's staged
5. Run `git log --oneline -5` to see recent commit message style
6. Write a commit message following the repo's convention (lowercase prefix like `feat:`, `fix:`, `refactor:`, etc.) — short title summarizing the WHY, not the WHAT
7. Commit using a HEREDOC for the message
8. Push to the remote with `git push`
9. Print the resulting commit hash and a summary of what was staged and why
