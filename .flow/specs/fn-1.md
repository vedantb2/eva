# AI Agent Kanban Board Frontend

## Overview

Transform the existing web codebase into a Kanban board application for AI agents to manage projects and tasks. The frontend will be built using the existing Next.js 15 + React 19 stack with HeroUI components, Tailwind CSS, and Convex backend.

## Scope

**In Scope:**
- Convex schema for projects and tasks
- Project list/selection UI
- Kanban board with draggable columns (Todo, In Progress, Done)
- Task cards with title, description, status
- CRUD operations for projects and tasks
- Drag-and-drop to move tasks between columns
- Real-time sync via Convex subscriptions

**Out of Scope:**
- AI agent implementation (deferred)
- Mobile app changes
- User collaboration features
- Task assignments to specific agents

## Approach

1. **Backend Schema** - Define Convex tables for `projects` and `tasks`
2. **API Layer** - Create Convex queries and mutations for CRUD operations
3. **Project Management** - Build project list page with create/select functionality
4. **Kanban Board** - Build the main board view with columns and task cards
5. **Drag-and-Drop** - Integrate dnd-kit for moving tasks between columns

## Technical Decisions

- **Drag-and-drop**: Use `@dnd-kit/core` (best React 19 support, accessible, performant)
- **Reuse existing patterns**:
  - `Card` component from `web/lib/components/ui/Card.tsx`
  - `Button` from `web/lib/components/ui/Button.tsx`
  - `Input` from `web/lib/components/ui/Input.tsx`
  - `PageHeader` from `web/lib/components/PageHeader.tsx`
  - `Container` from `web/lib/components/ui/Container.tsx`
- **Route structure**: `app/(main)/projects/` for project list, `app/(main)/projects/[id]/` for board view

## Quick Commands

```bash
# Run dev server to test
cd web && npm run dev

# Type check
cd web && npx tsc --noEmit
```

## Acceptance Criteria

- [ ] Projects can be created, listed, and deleted
- [ ] Kanban board displays tasks in three columns: Todo, In Progress, Done
- [ ] Tasks can be created, edited, and deleted
- [ ] Tasks can be dragged between columns to update status
- [ ] Changes sync in real-time via Convex
- [ ] UI follows existing design patterns (HeroUI + Tailwind)
- [ ] TypeScript strict mode passes with no errors

## References

- Existing UI components: `web/lib/components/ui/`
- Convex schema pattern: `backend/convex/schema.ts`
- Page layout pattern: `web/app/(main)/layout.tsx`
- Client providers: `web/lib/components/ClientProvider.tsx`
