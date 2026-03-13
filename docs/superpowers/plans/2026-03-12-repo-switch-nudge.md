# Repo Switch Nudge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a nudge banner when the user switches browser tabs to a domain matching a different repo than currently selected.

**Architecture:** Add `currentTabHost` state updated by `onActivated`/`onUpdated` listeners. Derive `suggestedRepoId` via `useMemo`. Render a banner between header and chat when suggestion differs from selection.

**Tech Stack:** React, Chrome Extension APIs (`chrome.tabs.onActivated`, `chrome.tabs.onUpdated`)

**Spec:** `docs/superpowers/specs/2026-03-12-repo-switch-nudge-design.md`

---

## Chunk 1: Implementation

Changes in `apps/chrome-extension/src/sidepanel/App.tsx` and `apps/chrome-extension/src/sidepanel/components/RepoSelector.tsx`.

### Task 1: Fix `handleRepoChange` type and add new state

**Files:**

- Modify: `apps/chrome-extension/src/sidepanel/App.tsx:130-135` (new state)
- Modify: `apps/chrome-extension/src/sidepanel/App.tsx:346-351` (handleRepoChange type)
- Modify: `apps/chrome-extension/src/sidepanel/components/RepoSelector.tsx:13-17` (prop types)

- [ ] **Step 1: Update `handleRepoChange` to accept `Id<"githubRepos">`**

Replace `handleRepoChange` (line 346-351):

```tsx
const handleRepoChange = useCallback((repoId: Id<"githubRepos">) => {
  setSelectedRepoId(repoId);
  setCurrentSessionId(null);
  chrome.storage.local.set({ defaultRepoId: repoId });
}, []);
```

- [ ] **Step 2: Update `RepoSelector` prop types**

In `RepoSelector.tsx`, update the interface (lines 13-17):

```tsx
interface RepoSelectorProps {
  repos: Doc<"githubRepos">[];
  selectedRepoId: Id<"githubRepos"> | null;
  onRepoChange: (repoId: Id<"githubRepos">) => void;
}
```

Add `Id` import: `import type { Doc, Id } from "@conductor/backend";`

Update `Select`'s `onValueChange` (line 62) to cast at the boundary:

```tsx
<Select
  value={selectedRepoId ?? ""}
  onValueChange={(val) => onRepoChange(val as Id<"githubRepos">)}
>
```

Note: The `as` cast is acceptable here — this is a system boundary where `Select` returns `string` but we know the values are repo IDs.

- [ ] **Step 3: Add state declarations**

After `isValidUrl` state (line 135), add:

```tsx
const [currentTabHost, setCurrentTabHost] = useState<string | null>(null);
const [dismissedSuggestion, setDismissedSuggestion] =
  useState<Id<"githubRepos"> | null>(null);
```

- [ ] **Step 4: Update the tab listeners effect**

Replace the existing `useEffect` at lines 372-400 with:

```tsx
useEffect(() => {
  const checkCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const host = tab?.url ? getHostFromUrl(tab.url) : null;
    setIsValidUrl(host ? isAllowedHost(host, allRepoDomains) : false);
    setCurrentTabHost(host);
    if (host) {
      let bestMatch: { domain: string; repoId: Id<"githubRepos"> } | null =
        null;
      for (const [domain, repoId] of domainToRepoId) {
        if (
          domainMatches(host, domain) &&
          (!bestMatch || domain.length > bestMatch.domain.length)
        ) {
          bestMatch = { domain, repoId };
        }
      }
      if (bestMatch && !selectedRepoId) {
        handleRepoChange(bestMatch.repoId);
      }
    }
  };
  checkCurrentTab();

  const handleTabUpdate = (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
  ) => {
    if (changeInfo.url) {
      const host = getHostFromUrl(changeInfo.url);
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id === tabId && host) {
          setIsValidUrl(isAllowedHost(host, allRepoDomains));
          setCurrentTabHost(host);
        }
      });
    }
  };

  const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      const host = tab?.url ? getHostFromUrl(tab.url) : null;
      setIsValidUrl(host ? isAllowedHost(host, allRepoDomains) : false);
      setCurrentTabHost(host);
    });
  };

  chrome.tabs.onUpdated.addListener(handleTabUpdate);
  chrome.tabs.onActivated.addListener(handleTabActivated);
  return () => {
    chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    chrome.tabs.onActivated.removeListener(handleTabActivated);
  };
}, [allRepoDomains, domainToRepoId, selectedRepoId, handleRepoChange]);
```

- [ ] **Step 5: Remove `autoSelectByHost`**

Delete the `autoSelectByHost` callback (lines 353-370). It is no longer used.

- [ ] **Step 6: Commit**

```bash
git add apps/chrome-extension/src/sidepanel/App.tsx apps/chrome-extension/src/sidepanel/components/RepoSelector.tsx
git commit -m "feat: add currentTabHost state and onActivated listener"
```

### Task 2: Add derived `suggestedRepoId` and nudge banner

**Files:**

- Modify: `apps/chrome-extension/src/sidepanel/App.tsx`

- [ ] **Step 1: Add `suggestedRepoId` useMemo**

After the new `dismissedSuggestion` state declaration (placed in Task 1), add:

```tsx
const suggestedRepoId = useMemo(() => {
  if (!currentTabHost) return null;
  let bestMatch: { domain: string; repoId: Id<"githubRepos"> } | null = null;
  for (const [domain, repoId] of domainToRepoId) {
    if (
      domainMatches(currentTabHost, domain) &&
      (!bestMatch || domain.length > bestMatch.domain.length)
    ) {
      bestMatch = { domain, repoId };
    }
  }
  if (!bestMatch) return null;
  const matchedRepoId = bestMatch.repoId;
  const exists = repos.some((r) => r._id === matchedRepoId);
  if (!exists) return null;
  return matchedRepoId;
}, [currentTabHost, domainToRepoId, repos]);

const suggestedRepo =
  suggestedRepoId &&
  suggestedRepoId !== selectedRepoId &&
  dismissedSuggestion !== suggestedRepoId
    ? repos.find((r) => r._id === suggestedRepoId)
    : null;
```

- [ ] **Step 2: Add nudge banner JSX**

In the return JSX, between the closing `</header>` and the `{pendingProjectPins && (` block, add:

```tsx
{
  suggestedRepo && (
    <div className="border-b border-border bg-muted/50 px-4 py-2 space-y-1.5">
      <p className="text-sm text-muted-foreground">
        This page matches{" "}
        <span className="font-medium text-foreground">
          {suggestedRepo.owner}/{suggestedRepo.name}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            handleRepoChange(suggestedRepo._id);
            setDismissedSuggestion(null);
          }}
        >
          Switch
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissedSuggestion(suggestedRepo._id)}
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/chrome-extension/src/sidepanel/App.tsx
git commit -m "feat: add repo switch nudge banner on tab change"
```

### Task 3: Verify types

- [ ] **Step 1: Run typecheck**

```bash
cd apps/chrome-extension && npx tsc --noEmit
```

Fix any type errors if present.

- [ ] **Step 2: Commit fixes (if any)**

```bash
git add apps/chrome-extension/src/sidepanel/App.tsx
git commit -m "fix: resolve type errors in nudge implementation"
```
