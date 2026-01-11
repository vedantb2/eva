- Added repoId field to boards table with by_repo index
- Added branchName field to agentTasks table
- Created subtasks table with parentTaskId, title, completed, order fields and by_parent index
- Created taskComments table with taskId, content, authorId, createdAt fields and by_task index

Why:
- Enable 1:1 board-to-repo mapping for per-repository Kanban boards
- Support feature branches per task
- Enable hierarchical task breakdown with subtasks
- Allow discussion threads on tasks

Verification:
- npx convex dev --once passes without errors
