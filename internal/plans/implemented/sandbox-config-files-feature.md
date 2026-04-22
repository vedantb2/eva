# Sandbox Config Files Feature

## Context

User needs to seed databases in sandboxes with sensitive data (seed.sql) that can't be committed to the repo. Solution: upload files to Convex storage via settings UI, bake them into the snapshot during build so they're pre-installed at `/tmp/sandbox-config/`.

## Requirements Summary

- **Scope**: Per-repo (shared across all team members)
- **Destination**: `/tmp/sandbox-config/{fileName}` (baked into snapshot)
- **Timing**: Files downloaded during snapshot build, not at sandbox startup
- **Permissions**: Any repo member can upload/delete
- **Limits**: None
- **Rebuild required**: When files change, snapshot must be rebuilt to pick up changes

---

## Implementation

### 1. Schema — `packages/backend/convex/schema.ts`

Add new table after `repoSnapshots`:

```ts
sandboxConfigFiles: defineTable({
  repoId: v.id("githubRepos"),
  storageId: v.id("_storage"),
  fileName: v.string(),
  fileSize: v.number(),
  uploadedBy: v.id("users"),
  createdAt: v.number(),
}).index("by_repo", ["repoId"]),
```

### 2. Convex Functions — `packages/backend/convex/sandboxConfigFiles.ts` (new file)

| Function                    | Type          | Purpose                                            |
| --------------------------- | ------------- | -------------------------------------------------- |
| `generateUploadUrl`         | authMutation  | Get upload URL for file                            |
| `save`                      | authMutation  | Save file record (replace if same filename exists) |
| `list`                      | authQuery     | List files for repo                                |
| `remove`                    | authMutation  | Delete file + storage                              |
| `getConfigFilesForSnapshot` | internalQuery | Get file URLs for snapshot build                   |

All functions check repo access via `hasRepoAccess()`.

### 3. Snapshot Build Integration — `packages/backend/convex/snapshotActions.ts`

**3a. Modify `kickOffSnapshotBuild()` action:**
Before building the image, query config files and pass URLs to `buildSnapshotImage()`:

```ts
// Query config files for this repo
const configFiles = await ctx.runQuery(
  internal.sandboxConfigFiles.getConfigFilesForSnapshot,
  { repoId: config.repoId },
);

// Build image with config file URLs
const image = buildSnapshotImage(
  token,
  repo.owner,
  repo.name,
  branch,
  configFiles,
);
```

**3b. Modify `buildSnapshotImage()` function:**
Add parameter for config files, add curl commands to Dockerfile:

```ts
function buildSnapshotImage(
  token: string,
  owner: string,
  repoName: string,
  branch: string,
  configFiles: Array<{ fileName: string; url: string }>, // NEW
): Image {
  return (
    Image.base("node:20-bookworm")
      .runCommands(
        // ... existing setup commands ...
        // Create config directory
        "mkdir -p /tmp/sandbox-config",
      )
      // ... existing commands ...
      // Download config files (after user creation, as eva)
      .runCommands(
        ...configFiles.map(
          (f) =>
            `curl -fsSL -o /tmp/sandbox-config/${escapeShell(f.fileName)} '${f.url}'`,
        ),
      )
  );
  // ... rest of image build ...
}
```

Key placement: After `USER eva` directive (line ~73) so files are owned by eva, before the repo clone step.

### 4. UI — `apps/web/src/routes/_repo/$owner/$repo/settings/SnapshotsClient.tsx`

Add 4th tab "Config Files" after "Builds" (line ~118):

```tsx
<TabsTrigger value="config-files">Config Files</TabsTrigger>
```

New `ConfigFilesSection` component (~80 lines):

- Query `sandboxConfigFiles.list`
- File upload via hidden `<input type="file">` + label Button
- Upload flow: `generateUploadUrl` → fetch POST → `save`
- Table: fileName (mono), size (formatted), date, delete button
- **Warning banner**: "Files are baked into snapshots. Rebuild snapshot after adding/removing files."
- Optional: "Rebuild Now" button that triggers `startBuild`

---

## Files to Modify/Create

| File                                                                  | Action                                                   |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| `packages/backend/convex/schema.ts`                                   | Add `sandboxConfigFiles` table                           |
| `packages/backend/convex/sandboxConfigFiles.ts`                       | **Create** — CRUD + internal query                       |
| `packages/backend/convex/snapshotActions.ts`                          | Modify `buildSnapshotImage()` + `kickOffSnapshotBuild()` |
| `apps/web/src/routes/_repo/$owner/$repo/settings/SnapshotsClient.tsx` | Add Config Files tab + section                           |

---

## Flow Diagram

```
User uploads file in UI
    ↓
File stored in Convex storage (sandboxConfigFiles table)
    ↓
User clicks "Rebuild Snapshot" (or waits for scheduled rebuild)
    ↓
kickOffSnapshotBuild() queries sandboxConfigFiles.getConfigFilesForSnapshot()
    ↓
buildSnapshotImage() generates Dockerfile with:
    RUN curl -fsSL -o /tmp/sandbox-config/seed.sql '{convex_storage_url}'
    ↓
Daytona builds snapshot image (15-20 min)
    ↓
All sandboxes from this snapshot have files pre-installed
```

---

## Edge Cases

1. **URL expiration**: Convex storage URLs expire after several hours. Snapshot builds take ~15-20 min, so URLs should remain valid. If build is queued/delayed significantly, might fail — user can retry.

2. **File name collisions**: If user uploads file with same name, we replace the old one. On next snapshot rebuild, new file is used.

3. **No snapshot configured**: If user uploads files but hasn't configured a snapshot yet, files sit in storage. Once snapshot is configured and built, they're included.

4. **Large files**: No size limit per requirements. Very large files may slow snapshot build but won't break it.

---

## Verification

1. **Schema**: `cd packages/backend && npx convex codegen --typecheck enable`
2. **Upload flow**: Upload a file in Snapshots > Config Files, verify appears in list
3. **Snapshot build**: Rebuild snapshot, check build logs show curl commands
4. **Sandbox verification**: Start task from new snapshot, SSH in, verify `/tmp/sandbox-config/` contains file
5. **Delete + rebuild**: Remove file, rebuild snapshot, verify file gone from new sandboxes

---

## Filename Validation

Restrict filenames to safe characters only: `a-z`, `A-Z`, `0-9`, `-`, `_`, `.`

- Validate in `save` mutation, reject invalid filenames with clear error
- Prevents shell injection in curl commands
- Regex: `/^[a-zA-Z0-9._-]+$/`
