- Created SubtaskList with add, toggle complete, delete functionality
- Created CommentThread with add, delete (author only) functionality
- Created TaskDetailModal showing title, status, branch, description, subtasks, comments
- Updated AgentTaskCard to open modal on title click
- Added branchName to AgentTask interface

Why:
- Enable detailed task view with subtasks and discussion

Verification:
- npx tsc --noEmit passes without errors
