# Plan — Host Cowork artifacts in eva (with the Eva MCP connector working in-app)

## Context

`C:/Users/vedan/Claude/Artifacts/nh-aqp-variation-2026-27/index.html` is a **Claude Cowork artifact**: a self-contained, Evalucom-branded HTML dashboard (gridjs + chart.js from jsDelivr) that pulls live NH AQP Variation return-status data. On load it calls:

```js
window.cowork.callMcpTool("mcp__6bff8141-…__postgres_query", {
  repoId: REPO,
  sql: SQL,
  limit: 1000,
});
```

`window.cowork` is injected only by Claude's Cowork host, so the page is dead anywhere else. The `6bff8141-…` server is **eva's own MCP server** (Convex HTTP route `/mcp`, `mcp/native.ts`); its `postgres_query` tool already does `assertRepoAccess` + a read-only replica query and returns `{content:[{type:'text',text}]}`.

**Goal:** a reusable subsystem to upload a Cowork artifact into eva, open it in-app, and have `window.cowork.callMcpTool` resolve against eva's read-only MCP tools — reusing the signed-in Clerk session, no OAuth.

**Key insight:** inside eva the user is already authenticated and eva _is_ the MCP backend. A shim posts the call to the parent, which calls one Convex `authAction` that re-dispatches the existing read-only tools as `ctx.userId` and returns the **identical envelope**, so artifacts run unmodified. eva sets **no CSP**, so the shim injects cleanly via a sandboxed `srcdoc` iframe.

## Decisions (locked)

- Reusable subsystem; HTML stored as a Convex file (`_storage`); new row per upload; manual delete; delete allowed for **any member of the bound team**.
- Read-only tools only: `postgres_query, query_table, run_query, get_document, count_table, list_repos`.
- **Artifacts bind to a TEAM, not a repo.** `boundTeamId` scopes **listing/visibility** only. Tool calls may target **any repo the signed-in user can access** — which, via team membership, is exactly "any repo in the user's team(s)". The bridge takes `{toolName, args}`; the global read-only whitelist is the gate; `declaredTools` is advisory metadata.
- UI in **both** a global `/artifacts` area and a **team tab** `/teams/$teamId/artifacts` (the repo tab from the earlier draft is replaced by a team tab, since binding is now team-based).
- Convex-targeting tools default `environment: "prod"` (matches the MCP tools).

**Why the bridge is unchanged:** `checkRepoAccessForUser` ([queries.ts:7](packages/backend/convex/mcp/queries.ts)) already grants access when `repo.connectedBy === userId` **or** the user is in the repo's team. So a team member calling `postgres_query` against the carepulse repo — or any other repo in any of their teams — passes the per-call check with no special handling. Team binding affects only where the artifact is listed.

---

## Backend — `packages/backend/convex`

**New helper** in `functions.ts` (beside `hasRepoAccess`):

```ts
export async function hasTeamAccess(
  db,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const m = await db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userId", userId),
    )
    .first();
  return m !== null;
}
```

(mirrors the membership check in [teams.ts:133](packages/backend/convex/teams.ts)).

**Table fields** — append `artifactFields` to `_validators/tableFields.ts` (single source of truth, re-exported via `validators.ts:3`):

```ts
export const artifactFields = {
  name: v.string(),
  description: v.optional(v.string()),
  boundTeamId: v.id("teams"),
  declaredTools: v.array(v.string()), // advisory; from the manifest
  htmlStorageId: v.id("_storage"),
  uploadedBy: v.id("users"),
  createdAt: v.number(),
};
```

`schema.ts`: `artifacts: defineTable(artifactFields).index("by_team",["boundTeamId"]).index("by_uploader",["uploadedBy"])`.

**New file `artifacts.ts`** — return validators composed from `artifactFields` (`{_id,_creationTime,...artifactFields}`, plus a `url` variant). Reuse `hasTeamAccess`, `errorResult`/`textResult` ([mcp/tools.ts:7](packages/backend/convex/mcp/tools.ts)) — do **not** re-declare the envelope.

- `generateUploadUrl` (authMutation) → `ctx.storage.generateUploadUrl()` (mirror [screenshots.ts:6](packages/backend/convex/screenshots.ts)).
- `create` (authMutation `{name,description?,boundTeamId,declaredTools,htmlStorageId}`) → `hasTeamAccess` check; insert `{...args, uploadedBy: ctx.userId, createdAt: Date.now()}`.
- `get` (authQuery `{id}`) → row + `url: await ctx.storage.getUrl(htmlStorageId)`; return `null` if not a member of `boundTeamId` (pattern: [taskProof.ts:84](packages/backend/convex/taskProof.ts) for getUrl, [teams.ts:114](packages/backend/convex/teams.ts) for member-or-null).
- `listForTeam` (authQuery `{teamId}`, `by_team`, `hasTeamAccess`-gated).
- `listAll` (authQuery): `teamMembers` `by_user` → for each team, `artifacts` `by_team`; flatten + sort by `createdAt` desc. Bounded, index-backed.
- `remove` (authMutation `{id}`) → `hasTeamAccess` to `boundTeamId`; `ctx.storage.delete` then `ctx.db.delete`.
- **`callTool` (authAction `{toolName: v.string(), args: v.string()}`)** — the bridge, **unchanged by team binding**. Returns `{content:[{type:"text",text}], isError?}`.
  - Strip `mcp__<serverId>__` → bare name via `lastIndexOf("__")`; reject if not in the read-only whitelist.
  - `args` is a JSON string; funnel `JSON.parse` through a `jsonValue` zod schema (copy the `z.lazy` pattern at [nodeActions.ts:270](packages/backend/convex/mcp/nodeActions.ts)) then a **per-tool zod schema** mirroring [tools.ts](packages/backend/convex/mcp/tools.ts) (incl. defaults). Satisfies the no-`any`/`unknown`/`as` rule — zod output is fully inferred.
  - Dispatch (reusing existing internals, with `ctx.userId` as the `userId` string; clerkId **not** needed, `getContext` **bypassed**):

  | tool             | access check                                  | engine                                                                                                                                    |
  | ---------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
  | `postgres_query` | `internal.mcp.queries.checkRepoAccessForUser` | `internal.mcp.postgres.runPostgresQuery {repoId,sql,maxRows:limit}`                                                                       |
  | `list_repos`     | none                                          | `internal.mcp.nodeActions.listUserRepos {userId}` + `internal.mcp.queries.reposWithPostgresReplica`                                       |
  | `query_table`    | access + creds                                | `getRepoConvexCredentials {repoId,userId,environment}` → `nodeActions.queryTable {convexUrl,deployKey,table,order,numItems:limit,cursor}` |
  | `run_query`      | access + creds                                | creds → `nodeActions.runTestQuery {convexUrl,deployKey,code}`                                                                             |
  | `get_document`   | access + creds                                | creds → `runTestQuery` with `return await ctx.db.get(<id>)` (validate id format)                                                          |
  | `count_table`    | access + creds                                | creds → `runTestQuery` with `.collect().length` (validate table name)                                                                     |

  Wrap success in `textResult({...})`, failure in `errorResult(msg)` — byte-identical to the MCP path. The access/credential glue (`assertRepoAccess`, `resolveTargetWithAccess`) is a thin wrapper over `internal.mcp.queries.checkRepoAccessForUser` and `internal.mcp.nodeActions.getRepoConvexCredentials` → call them directly, no `tools.ts` refactor.

---

## Web — `apps/web/src`

No new deps; no `vite.config.ts` dedupe change (vanilla iframe + postMessage + existing Convex client).

**Shared components** in `lib/components/artifacts/`:

- `ArtifactUploadDialog` — file picker; parse the `<script id="cowork-artifact-meta">` JSON client-side → `name`, `description`, `declaredTools` (from `mcpTools`); **team dropdown** from the existing user-teams query (used by [TeamsClient.tsx](apps/web/src/routes/_global/teams/TeamsClient.tsx)); upload flow = `generateUploadUrl()` → `fetch(url,{method:"POST",headers:{"Content-Type":"text/html"},body:file})` → storageId → `create` (pattern: [SnapshotsClient.tsx](apps/web/src/routes/_repo/$owner/$repo/settings/SnapshotsClient.tsx)).
- `ArtifactViewer` — calls `api.artifacts.get`; `fetch(url).then(r=>r.text())`; sets `iframe.srcdoc = SHIM + html`; `sandbox="allow-scripts"` (opaque origin). Bridge hook `useArtifactBridge(iframeRef)`: on `message` where `event.source===iframeRef.current?.contentWindow` and `data.type==='eva-mcp-call'`, call `useAction(api.artifacts.callTool)({toolName:data.name, args:JSON.stringify(data.args)})`, post `{type:'eva-mcp-result', id, result}` back with targetOrigin `"*"` (validation pattern: [PreviewNavBar.tsx:137](apps/web/src/lib/components/PreviewNavBar.tsx)).
- `ArtifactList` / cards (mirror the `drafts` thin-orchestrator split).

**The shim** (string prepended to the HTML, runs before the artifact):

```js
window.cowork = {
  callMcpTool(name, args) {
    return new Promise((resolve, reject) => {
      const id = ++__n;
      __pending[id] = { resolve, reject };
      parent.postMessage({ type: "eva-mcp-call", id, name, args }, "*");
    });
  },
};
addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.type !== "eva-mcp-result") return;
  const p = __pending[d.id];
  if (!p) return;
  delete __pending[d.id];
  d.error ? p.reject(new Error(d.error)) : p.resolve(d.result);
});
```

**Routes (thin orchestrators):**

- Global: `routes/_global/artifacts/index.tsx` (→ `listAll` + upload) and `routes/_global/artifacts/$artifactId.tsx` (→ `ArtifactViewer`).
- Team tab: add `"artifacts"` to the team detail tab route ([\_global/teams/$teamId/$teamTab.tsx](apps/web/src/routes/_global/teams/$teamId/$teamTab.tsx)) → renders a new `TeamArtifactsTab` (in `_global/teams/_components/`, beside `TeamReposTab`/`TeamMembersTab`) using `listForTeam` + upload pre-bound to that team. Add an "Artifacts" entry to the team page's tab nav.

**Nav:** add `{ name:"Artifacts", href:"/artifacts", icon: … }` to `ROOT_NAV_ITEMS` ([RootSidebarContent.tsx:21](apps/web/src/lib/components/sidebar/RootSidebarContent.tsx)) (icon from `@tabler/icons-react`). No repo-sidebar item (binding is team-based).

---

## Security

- Sandboxed `srcdoc` iframe = opaque origin, no `allow-same-origin` → no access to eva cookies/localStorage/DOM. CDN scripts + SRI still load (no CSP).
- Server is the real boundary: `callTool` requires a signed-in user, enforces the read-only whitelist, and runs `checkRepoAccessForUser` per call — so an artifact can only read repos the user already has via their team memberships. `runPostgresQuery` keeps READ-ONLY txn + single-statement + 30s timeout; `runTestQuery` runs in a read-only Convex query context (no writes possible).
- Listing/visibility gated by `hasTeamAccess`. Confidential provider data stays behind Clerk + team membership.

## Out of scope (v1)

External/non-eva sharing (e.g. a public link for commissioners) — needs a separate snapshot/export design, not live DB access. Versioning/edit-in-place (re-upload makes a new row). Per-artifact runtime tool restriction (declaredTools stays advisory).

## Verification

1. `cd packages/backend && npx convex codegen --typecheck enable` — clean.
2. `apps/web`: `npx tsc` — clean; confirm no `any`/`unknown`/`as`/`!`.
3. Manual end-to-end: upload `nh-aqp-variation-2026-27/index.html`, bind it to the team that owns the carepulse repo, open it — confirm the donut, % signed, counts, and the searchable provider table render with live data, and the London/Sussex/East Berkshire switcher works. Open via both the global `/artifacts` list and the team's Artifacts tab. As a second member of the team, confirm open + delete work. Confirm a user who is **not** in the bound team cannot open or list it. (Bonus: an artifact querying a _different_ repo in the same team also loads, proving the team-wide reach.)
