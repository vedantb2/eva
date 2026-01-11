# fn-2.8: Build agent run panel with real-time log streaming

## Description

Create the agent run UI components:

1. Expandable panel on task card to show current/last run
2. Log viewer with real-time streaming
3. Run metadata display (start time, duration, PR link)
4. Error state visualization

## Files to Create

- `web/lib/components/agent/AgentRunPanel.tsx` - expandable run details
- `web/lib/components/agent/LogViewer.tsx` - streaming log display
- `web/lib/components/agent/RunMetadata.tsx` - timestamps and links

## Implementation Notes

- AgentRunPanel expands below task card when clicked
- Use `useQuery(api.agentRuns.get, { runId })` for real-time updates
- LogViewer should:
  - Display logs with colored level indicators (info=blue, warn=yellow, error=red)
  - Auto-scroll to bottom on new logs
  - Show timestamps in HH:MM:SS format
- RunMetadata shows:
  - Started/finished times
  - Duration calculation
  - PR link as clickable button (when present)
  - Result summary text

## Acceptance Criteria

- [ ] Task cards have expand button when runs exist
- [ ] Panel shows current/latest run details
- [ ] Logs stream in real-time via Convex subscription
- [ ] Log viewer auto-scrolls to bottom
- [ ] Timestamps display correctly
- [ ] PR link opens in new tab
- [ ] Error state shows red styling with error message
