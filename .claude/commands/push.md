Commit all staged changes and push to the remote.

Steps:

1. Run `git diff --cached --stat` to review what's staged
2. Run `git log --oneline -5` to see recent commit message style
3. Write a commit message following the repo's convention (lowercase prefix like `feat:`, `fix:`, `refactor:`, etc.) — short title summarizing the WHY, not the WHAT
4. Commit using a HEREDOC for the message
5. Push to the remote with `git push`
6. Print the resulting commit hash
