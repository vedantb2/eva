# fn-1.3 Build project list page

## Description

Build the project list page at `web/app/(main)/projects/page.tsx`.

**Features:**
- Display list of user's projects as cards
- "Create Project" button that opens a modal/form
- Click project card to navigate to Kanban board (`/projects/[id]`)
- Delete project button on each card

**Components to create:**
- `web/app/(main)/projects/page.tsx` - Main page
- `web/lib/components/ProjectCard.tsx` - Project card component
- `web/lib/components/CreateProjectModal.tsx` - Create project form modal

**Reuse:**
- `Card` from `web/lib/components/ui/Card.tsx`
- `Button` from `web/lib/components/ui/Button.tsx`
- `Input` from `web/lib/components/ui/Input.tsx`
- `PageHeader` from `web/lib/components/PageHeader.tsx`
- `Container` from `web/lib/components/ui/Container.tsx`
- `EmptyState` from `web/lib/components/ui/EmptyState.tsx`

**Data fetching:**
- Use `useQuery` from Convex to fetch projects
- Use `useMutation` for create/delete operations
## Acceptance
- [ ] Projects page renders at `/projects`
- [ ] Shows list of projects or empty state
- [ ] Can create new project via modal
- [ ] Can delete project
- [ ] Click project navigates to `/projects/[id]`
- [ ] Uses existing UI component patterns
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
