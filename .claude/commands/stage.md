Stage all files relevant to changes made in this conversation.

Steps:

1. Run `git status -u` to see all modified, deleted, and untracked files
2. Identify which files are related to the work done in this conversation — exclude files that were already dirty before the conversation started or are unrelated
3. Stage them with `git add` using specific file paths (never use `git add -A` or `git add .`)
4. Run `git status` to confirm what was staged
5. Print a summary of what was staged and why
