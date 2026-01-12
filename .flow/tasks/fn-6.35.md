# fn-6.35 Implement dependency checking in task status transitions

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Already implemented in updateStatus mutation (agentTasks.ts:275)
- Checks dependencies before allowing transition to work statuses (todo, in_progress, code_review)
- Throws error with blocking task name if blocked
## Evidence
- Commits:
- Tests:
- PRs: