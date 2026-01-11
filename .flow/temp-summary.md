- Added repoId to boards types and listByRepo query
- Added branchName to agentTasks types
- Added githubRepos section (list, get, getByOwnerAndName, create, remove)
- Added subtasks section (listByTask, create, update, remove, reorder)
- Added taskComments section (listByTask, create, remove)

Why:
- Frontend components need type definitions to use new backend functions

Verification:
- npx tsc --noEmit passes without errors
