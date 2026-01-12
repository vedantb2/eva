# fn-6.43 Create repo URL helper functions (encode/decode owner-repo)

## Description

Create utility functions for encoding/decoding repo slugs in URLs.

### Implementation

```typescript
// web/lib/utils/repoUrl.ts

/**
 * Encode repo full name for URL usage
 * "owner/repo-name" -> "owner-repo-name"
 */
export function encodeRepoSlug(fullName: string): string {
  return fullName.replace("/", "-");
}

/**
 * Decode URL slug back to repo full name
 * "owner-repo-name" -> "owner/repo-name"
 * Note: This assumes owner doesn't contain hyphens (GitHub restriction)
 */
export function decodeRepoSlug(slug: string): string {
  const firstHyphen = slug.indexOf("-");
  if (firstHyphen === -1) return slug;
  return slug.slice(0, firstHyphen) + "/" + slug.slice(firstHyphen + 1);
}

/**
 * Build a repo-scoped URL path
 */
export function buildRepoPath(fullName: string, path: string): string {
  return `/${encodeRepoSlug(fullName)}${path}`;
}
```

### Key Points
- Simple hyphen replacement since GitHub usernames can't have hyphens at start/end
- First hyphen marks the owner/repo boundary
- Helper for building repo-scoped paths

### Files to Create
- `web/lib/utils/repoUrl.ts`
## Acceptance
- [ ] TBD

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
