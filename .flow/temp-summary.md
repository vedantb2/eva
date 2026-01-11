- Added Repositories nav item to Sidebar with GitHub icon
- Created /repositories page listing connected repos with cards
- Created /repositories/[owner]/[repo] page with per-repo Kanban board
- Auto-creates board for repo if none exists on first visit

Why:
- Enable per-repository feature tracking with Kanban boards

Verification:
- npx tsc --noEmit passes without errors
