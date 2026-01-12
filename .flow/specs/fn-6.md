# Epic: Complete App Restructure

## Overview

Major refactoring of the Conductor app to implement repo-based routing, AI-powered plan generation, feature management with task dependencies, and quick tasks. This transforms the app from a simple Kanban board into a comprehensive project management tool with AI spec generation capabilities.

## Scope

### In Scope
- New routing structure: /[repo]/plan, /[repo]/features, /[repo]/features/[featureId], /[repo]/quick-tasks
- GitHub repo switcher dropdown (HeroUI)
- Plan page: conversational AI spec generator with interview flow
- Features page: list view + detail Kanban with auto-generated tasks
- Quick Tasks page: simple Kanban for one-off tasks
- Task dependencies (blocks execution until dependencies complete)
- Subtasks (documentation/checklist only)
- 6 task states: archived, backlog, todo, in_progress, code_review, done
- Sidebar accordion for active tasks
- Feature/task branch naming conventions

### Out of Scope
- Agent execution logic (existing)
- GitHub OAuth/installation (existing)
- Mobile-specific layouts
- Offline support

## Approach

### Phase 1: Database Schema
Add new tables (plans, features) and update existing tables (agentTasks) with new fields for dependencies, featureId, and expanded status.

### Phase 2: Routing Restructure
Move from (main)/ route group to (main)/[repo]/ with nested routes. Add RepoLayout component.

### Phase 3: Core Components
Build repo switcher, plan conversation UI, feature list, updated Kanban with dependencies.

### Phase 4: AI Integration
Implement OpenRouter-based spec generation, interview flow, and task generation.

### Phase 5: Polish
Sidebar active tasks accordion, dependency visualization, branch management.

## Technical Decisions

1. **URL Format**: Use /[owner]-[repo]/... (hyphen-joined) to avoid path segment issues with owner/name
2. **Plan Storage**: New plans table with conversation history as JSON array
3. **Task Dependencies**: Join table taskDependencies with taskId and dependsOnId
4. **State Machine**: Use React state (not XState) for plan states to keep simple
5. **AI Provider**: OpenRouter via AI SDK for chat/streaming

## Quick Commands

```bash
# Run dev server
cd web && npm run dev

# Run Convex dev
cd backend && npx convex dev

# Type check
cd web && npx tsc --noEmit
```

## Acceptance Criteria

- [ ] Routing: All routes under /[repo]/ work correctly
- [ ] Repo Switcher: Can switch repos and URL updates
- [ ] Plans: Can create plan via conversation, save draft, finalize, create feature
- [ ] Features: Can view feature list, click into feature, see Kanban with tasks
- [ ] Dependencies: Tasks with unmet dependencies show blocked state, cannot execute
- [ ] Quick Tasks: Can create single task via prompt
- [ ] Sidebar: Shows collapsible active tasks accordion
- [ ] Task States: All 6 states work correctly
- [ ] Branches: Feature creates base branch, tasks create sub-branches

## References

### Key Files
- backend/convex/schema.ts:1-132 - Current database schema
- web/app/(main)/layout.tsx:1-16 - Main layout with Sidebar
- web/lib/components/Sidebar.tsx:18-24 - Current navigation
- web/lib/components/agent/AgentKanbanBoard.tsx:1-117 - dnd-kit Kanban
- web/lib/components/features/NewFeatureModal.tsx:1-233 - AI generation pattern

### Documentation
- Convex Schemas: https://docs.convex.dev/database/schemas
- Next.js Dynamic Routes: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
- HeroUI Dropdown: https://www.heroui.com/docs/components/dropdown
- AI SDK OpenRouter: https://ai-sdk.dev/providers/community-providers/openrouter

## Open Questions

1. URL format: Using hyphen-joined owner-repo to avoid path conflicts
2. Quick tasks: Repo-scoped under /[repo]/quick-tasks
3. Branch collision: Will auto-increment suffix (feature-test-1, feature-test-2)
