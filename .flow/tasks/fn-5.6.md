# fn-5.6 Build Repositories list page with navigation

## Description

Create the Repositories page and update navigation:

1. **Update Sidebar**: Add "Repositories" nav item in `web/lib/components/Sidebar.tsx`
2. **Create page**: `web/app/(main)/repositories/page.tsx`
   - List connected GitHub repos using `githubRepos.list` query
   - Each repo card shows owner/name and "View Board" button
   - Link to `/repositories/[owner]/[repo]` for board view
3. **Create repo board page**: `web/app/(main)/repositories/[owner]/[repo]/page.tsx`
   - Fetch or create board for this repo
   - Render existing AgentKanbanBoard component

## Files to Create/Modify
- `web/lib/components/Sidebar.tsx` (modify)
- `web/app/(main)/repositories/page.tsx` (new)
- `web/app/(main)/repositories/[owner]/[repo]/page.tsx` (new)

## Acceptance
- [ ] "Repositories" item appears in sidebar
- [ ] `/repositories` page lists all connected repos
- [ ] Each repo has clickable card linking to its board
- [ ] `/repositories/[owner]/[repo]` shows Kanban board
- [ ] No TypeScript errors

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
