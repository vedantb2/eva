# Repo Switch Nudge — Chrome Extension

**Date:** 2026-03-12

## Problem

When the sidepanel is open and the user switches browser tabs, the selected repo doesn't update. The user has to manually switch repos even though we can detect which repo matches the current tab's domain.

## Solution

Show a nudge banner when the current tab's domain matches a different repo than the one selected. The user clicks "Switch" to change, or "✕" to dismiss.

## State

- **New state**: `currentTabHost: string | null` — tracks the active tab's hostname
- **New state**: `dismissedSuggestion: Id<"githubRepos"> | null` — tracks if user dismissed a specific suggestion
- **Derived** (`useMemo` on `[currentTabHost, domainToRepoId, selectedRepoId]`): `suggestedRepoId` — uses same `domainMatches` + longest-match logic as current `autoSelectByHost`. If resolved ID not found in `repos`, treat as null.
- **Derived** (inline): `showNudge` — true when `suggestedRepoId !== null && suggestedRepoId !== selectedRepoId && dismissedSuggestion !== suggestedRepoId`

## Listeners

Single `useEffect` registers both listeners, cleans up both in return:

1. **Initial mount** — `checkCurrentTab` sets both `isValidUrl` and `currentTabHost`. Calls `handleRepoChange` directly for initial auto-select (one-time, not via `autoSelectByHost`).
2. **`chrome.tabs.onUpdated`** — existing listener, sets `currentTabHost` and `isValidUrl` (remove `autoSelectByHost` call)
3. **`chrome.tabs.onActivated`** — NEW listener, queries active tab URL via `chrome.tabs.get(activeInfo.tabId)`, sets `currentTabHost` and `isValidUrl`

## Banner UI

Rendered above `pendingProjectPins` (if both show, nudge is first, project pins second). Two rows:

Row 1: "This page matches **owner/repo-name**" (resolved via `repos.find(r => r._id === suggestedRepoId)`, display as `owner/name`)
Row 2: [Switch] button and [✕] dismiss button

Styled as a subtle info bar (`border-b border-border bg-muted/50`), consistent with existing `pendingProjectPins` banner pattern.

## Behavior

- **"Switch"** → `handleRepoChange(suggestedRepoId)` — switches repo, clears session, persists to storage. Banner disappears because `suggestedRepoId === selectedRepoId` now.
- **"✕"** → sets `dismissedSuggestion = suggestedRepoId`. Banner hidden while dismissed suggestion matches.
- **Tab switch to matching repo** → `currentTabHost` changes → `suggestedRepoId` recalculates to `null` → banner gone naturally.
- **Tab switch to different unmatched domain** → `suggestedRepoId` changes → `dismissedSuggestion` no longer matches → new suggestion shows.

## Removal of auto-select

`autoSelectByHost` function is removed entirely. Initial mount does a one-time direct `handleRepoChange` call if a domain match is found. After initial load, domain-based switching is user-initiated via the nudge.

## Type fix

`handleRepoChange` signature updated from `(repoId: string)` to `(repoId: Id<"githubRepos">)`, removing the `as` cast. `RepoSelector`'s `onRepoChange` prop updated to pass `Id<"githubRepos">` (it already receives repo objects with typed `_id`).

## Files changed

- `apps/chrome-extension/src/sidepanel/App.tsx` — all changes in this single file
