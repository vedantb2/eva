# fn-2.6: Build boards list page and create board modal

## Description

Create the boards management UI:

1. Boards list page at `/boards` showing all user boards
2. Board card component for list display
3. Create board modal with name input
4. Delete board confirmation

## Files to Create

- `web/app/(main)/boards/page.tsx` - boards list page
- `web/lib/components/boards/BoardCard.tsx` - board list item
- `web/lib/components/boards/CreateBoardModal.tsx` - board creation modal

## Patterns to Follow

Reference existing components:
- `web/app/(main)/projects/page.tsx` for page structure
- `web/lib/components/CreateProjectModal.tsx` for modal pattern
- `web/lib/components/ProjectCard.tsx` for card pattern

## Implementation Notes

- Use `useQuery(api.boards.list)` for board list
- Use `useMutation(api.boards.create)` in modal
- Board card shows name, task count, last updated
- Add board route to Sidebar navigation

## Acceptance Criteria

- [ ] `/boards` page displays user's boards
- [ ] "Create Board" button opens modal
- [ ] Modal validates name (non-empty)
- [ ] New board appears in list after creation
- [ ] Board card links to `/boards/[id]`
- [ ] Delete button with confirmation removes board
