# fn-5.7 Build TaskDetailModal with subtasks and comments

## Description

Create a modal that opens when clicking a task card, showing full details:

1. **TaskDetailModal component**: `web/lib/components/tasks/TaskDetailModal.tsx`
   - Display task title, description, status, branch name
   - SubtaskList section with add/complete/delete functionality
   - CommentThread section with add/delete functionality

2. **SubtaskList component**: `web/lib/components/tasks/SubtaskList.tsx`
   - List subtasks with checkboxes
   - Input to add new subtask
   - Delete button per subtask

3. **CommentThread component**: `web/lib/components/tasks/CommentThread.tsx`
   - List comments with author and timestamp
   - Textarea to add new comment
   - Delete button per comment (only for author)

4. **Update AgentTaskCard**: Add onClick to open TaskDetailModal

## Files to Create/Modify
- `web/lib/components/tasks/TaskDetailModal.tsx` (new)
- `web/lib/components/tasks/SubtaskList.tsx` (new)
- `web/lib/components/tasks/CommentThread.tsx` (new)
- `web/lib/components/agent/AgentTaskCard.tsx` (modify)

## Acceptance
- [ ] Clicking task card opens TaskDetailModal
- [ ] Modal displays task details including branch name
- [ ] Subtasks can be added, checked off, and deleted
- [ ] Comments can be added and deleted
- [ ] Modal closes on backdrop click or X button
- [ ] No TypeScript errors

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
