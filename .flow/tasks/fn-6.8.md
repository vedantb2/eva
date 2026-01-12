# fn-6.8 Update agentTasks mutations for featureId and dependency checking

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Updated taskStatusValidator to 6 states: archived, backlog, todo, in_progress, code_review, done
- Added featureId, taskNumber, branchName to agentTaskValidator
- Added listByFeature query
- Updated create mutation to accept new fields, defaults to backlog status
- Updated update mutation to handle new fields
- Updated updateStatus to check dependencies before allowing work statuses
- Updated remove to clean up dependencies in both directions
## Evidence
- Commits:
- Tests:
- PRs: