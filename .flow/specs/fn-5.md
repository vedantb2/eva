# GitHub Repositories Tab with Subtasks, Comments, and AI Spec Generation

## Overview

Add a "Repositories" tab to Conductor where each connected GitHub repository has its own Kanban board. Tasks on these boards represent features/bugs, each task gets its own branch. Tasks support subtasks and comments. A "New feature" button uses AI to generate detailed specs from brief descriptions.

## Scope

### In Scope
- New Repositories page listing connected GitHub repos
- Per-repository Kanban boards (1:1 repo-to-board relationship)
- Branch name field on tasks (auto-generated or user-specified)
- Subtasks table with parent-child relationships
- Comments table for task discussions
- "New feature" modal with AI spec generation
- Spec-to-task conversion workflow

### Out of Scope
- GitHub App OAuth setup (assume repos already connected)
- Actual GitHub branch creation (external agent handles this)
- GitHub webhook handling
- Comment mentions/notifications
- Nested subtask hierarchies (subtasks are flat)

## Approach

### Schema Changes
Extend existing Convex schema (`backend/convex/schema.ts`):

1. **Update `boards` table**: Add `repoId` field linking to `githubRepos`
2. **Update `agentTasks` table**: Add `branchName` field for branch tracking
3. **New `subtasks` table**: `{ parentTaskId, title, completed, order }`
4. **New `taskComments` table**: `{ taskId, content, authorId, createdAt }`

### Backend Functions
Create/update Convex functions:

1. **githubRepos.ts**: CRUD operations for repos
2. **boards.ts**: Update to filter by `repoId`
3. **subtasks.ts**: CRUD + reorder operations
4. **taskComments.ts**: CRUD operations
5. **specs.ts**: AI spec generation action

### Frontend Components
Following existing patterns in `web/lib/components/`:

1. **RepositoriesList**: List repos with "View Board" buttons
2. **TaskDetailModal**: Expanded view with subtasks, comments, branch
3. **NewFeatureModal**: AI spec generation wizard
4. **SubtaskList**: Checkbox list inside task detail
5. **CommentThread**: Comment input and list

### Navigation
Update `web/lib/components/Sidebar.tsx` to add "Repositories" nav item.

## Quick Commands

```bash
# Type check
cd web && npx tsc --noEmit

# Run dev server
cd web && npm run dev

# Check Convex types
cd backend && npx convex dev --once
```

## Acceptance Criteria

1. **Repositories tab visible** in sidebar navigation
2. **Repo list page** shows connected repositories with board links
3. **Per-repo board** displays Kanban columns and tasks
4. **Task detail modal** opens on task click with subtasks/comments
5. **Subtasks** can be added, completed, reordered, deleted
6. **Comments** can be added and displayed chronologically
7. **New feature button** opens spec generation modal
8. **AI generates spec** from brief description input
9. **Spec creates task** with title, description, and subtasks
10. **Branch name field** displayed on task cards and detail

## References

### Existing Code to Reuse
- `web/lib/components/agent/AgentKanbanBoard.tsx` - Kanban with dnd-kit
- `web/lib/components/agent/AgentTaskCard.tsx` - Task card pattern
- `web/lib/components/modals/ConfirmationModal.tsx` - Modal pattern
- `web/lib/components/boards/CreateBoardModal.tsx` - Form modal pattern
- `backend/convex/agentTasks.ts` - Task CRUD pattern

### Schema Location
- `backend/convex/schema.ts` - Lines 54-114 for existing tables

### Type Definitions
- `web/api.ts` - Must update with new endpoints

## Risks

| Risk | Mitigation |
|------|------------|
| AI API latency | Show loading state, allow retry |
| Large subtask lists | Limit to 20 subtasks per task |
| Comment spam | Rate limit on frontend |
