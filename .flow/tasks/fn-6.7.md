# fn-6.7 Create taskDependencies mutations (add, remove, getForTask)

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Created taskDependencies.ts with getForTask, getDependents, isBlocked, add, remove, removeByTasks
- isBlocked checks if any dependent task is not done
- Prevents self-referential dependencies
## Evidence
- Commits:
- Tests:
- PRs: