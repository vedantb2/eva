- Updated boardValidator to include repoId field
- Updated create mutation to accept optional repoId
- Added listByRepo query filtering by repo with owner check

Why:
- Enable 1:1 board-to-repo mapping for per-repository Kanban boards

Verification:
- npx convex dev --once passes without errors
