# fn-2.9: Build execution history page

## Description

Create the execution history view:

1. History page at `/history` showing all runs across boards
2. Run list with filtering by status
3. Run detail view with full logs

## Files to Create

- `web/app/(main)/history/page.tsx` - history list page
- `web/lib/components/agent/RunHistoryCard.tsx` - run list item
- `web/app/(main)/history/[runId]/page.tsx` - run detail page

## Convex Functions Needed

Add to `backend/convex/agentRuns.ts`:
- `listAll` - Query all runs for user's boards (across all boards)

## Implementation Notes

- History page shows runs in reverse chronological order
- Filter tabs: All, Running, Completed, Failed
- Each card shows: task title, board name, status, timestamp, duration
- Click card to see full run details with logs
- Link back to board from detail page

## Acceptance Criteria

- [ ] `/history` shows all runs across user's boards
- [ ] Status filter tabs work correctly
- [ ] Run cards show relevant metadata
- [ ] Clicking card navigates to detail view
- [ ] Detail view shows full log history
- [ ] Back navigation works correctly
