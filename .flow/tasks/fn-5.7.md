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
- Created SubtaskList with add, toggle complete, delete functionality
- Created CommentThread with add, delete (author only) functionality
- Created TaskDetailModal showing title, status, branch, description, subtasks, comments
- Updated AgentTaskCard to open modal on title click
- Added branchName to AgentTask interface

Why:
- Enable detailed task view with subtasks and discussion

Verification:
- npx tsc --noEmit passes without errors
## Evidence
- Commits: d2d277bada2304afd3cffcba0c79fa2f23e9ade0
- Tests: npx tsc --noEmit
- PRs: