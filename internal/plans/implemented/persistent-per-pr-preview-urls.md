# Persistent per-PR preview URLs

## Context

Today each commit mints a new unique preview URL (`{project}-{hash}.vercel.app`) from GitHub's Deployment Status API (`latestStatus.environment_url || latestStatus.target_url`) — so the URL you open keeps going stale. You want the stable **branch alias** Vercel auto-creates per PR (`{project}-git-{branch}-{team}.vercel.app`), which persists across commits and always points at the latest deployment for that branch.

Previously you tried constructing that alias client-side and it broke: when the subdomain exceeds the 63-char DNS label limit, Vercel truncates and appends a non-deterministic hash. Fix: **fetch the real alias from Vercel's API** instead of constructing it — Vercel returns the final valid URL, hash and all.

## Approach

After the existing GitHub Deployment polling resolves a per-commit URL, call Vercel's deployment API to fetch that deployment's `alias[]`, pick the entry containing `-git-`, and store **that** as `deploymentUrl`. If no `-git-` alias present yet, keep polling under the existing 20-attempt / 60s cadence; on the final attempt, fall back to the per-commit URL so the UI is never empty. Projects inherit the fix for free — project task runs already push to the project's own branch (`eva/project-<id>`), so run-level polling converges on the project's stable alias; `getLatestDeploymentByProject` then returns it with no change.

## Env vars — stored in platform's own team env vars (not Convex deployment env)

Platform already has a team/repo env var system (`teamEnvVars` table, UI at `/{owner}/{repo}/settings/env-variables?tab=team`, resolver `envVarResolver.resolveAllEnvVars(ctx, repoId)` at `packages/backend/convex/envVarResolver.ts:9`). Values are encrypted at rest and have a `sandboxExclude` flag.

User adds to team env vars with **`sandboxExclude: true`** so the token is never injected into user sandboxes:

- `VERCEL_TOKEN` — bearer token, required
- `VERCEL_TEAM_ID` — team ID/slug, required if token is team-scoped

Creation: Vercel dashboard → avatar → Account Settings → Tokens → Create Token → scope to team, set expiration → copy once → paste into platform's team env vars UI.

No Convex deployment env var changes. No GitHub/Vercel project env var involvement (those are for deployed apps; our backend isn't deployed via them).

## Files

### New: `packages/backend/convex/_deployment/vercel.ts`

```ts
"use node";
// Thin Vercel REST wrapper. Never throws; returns null on any failure so callers can fall back.
export async function fetchStableBranchAlias(args: {
  perCommitHostname: string; // e.g. "my-project-abc123.vercel.app"
  token: string; // resolved from team env vars by caller
  teamId: string | undefined; // resolved from team env vars by caller
}): Promise<string | null>;
```

- Strips protocol if present, passes hostname as `{idOrUrl}` to `GET https://api.vercel.com/v13/deployments/{hostname}?teamId=${teamId}`
- Bearer auth via injected `token` (caller resolves from team env vars — not `process.env`)
- Picks first alias matching `/-git-[^.]+\.vercel\.app$/` from the response's `alias[]`
- Returns null on HTTP error, missing token, or no matching alias
- Uses global `fetch`. No new npm deps.

### Modify: `packages/backend/convex/taskWorkflowActions.ts`

Plumb `repoId` through polling args so the action can resolve team env vars. Both pollers already take `installationId`/`repoOwner`/`repoName`; add `repoId: v.id("githubRepos")` alongside. `scheduleDeploymentTracking` (runLifecycle.ts:93) and `scheduleSessionDeploymentTracking` (sessionWorkflow.ts:262) already have access to the run/session, which carries `repoId`.

Extract the URL-resolution logic into a local helper (keeps both pollers in sync):

```ts
async function resolveStableDeploymentUrl(
  ctx: ActionCtx,
  repoId: Id<"githubRepos">,
  perCommitUrl: string | undefined,
  attempt: number,
): Promise<{ url: string | undefined; shouldKeepPolling: boolean }>;
```

- If `perCommitUrl` empty → `{ url: undefined, shouldKeepPolling: false }`
- Call `resolveAllEnvVars(ctx, repoId)` (from `envVarResolver.ts:9`) → read `VERCEL_TOKEN` + `VERCEL_TEAM_ID`
- If no token → `{ url: perCommitUrl, shouldKeepPolling: false }` (graceful degrade: behave exactly like today)
- Call `fetchStableBranchAlias({ perCommitHostname, token, teamId })`
- If alias returned → `{ url: alias, shouldKeepPolling: false }`
- If null AND `attempt < MAX_POLL_ATTEMPTS - 1` → `{ url: perCommitUrl /* don't overwrite with nothing */, shouldKeepPolling: true }`
- If null AND final attempt → `{ url: perCommitUrl, shouldKeepPolling: false }` (fallback)

Call sites:

- `pollDeploymentStatus` around line 352: replace `const deploymentUrl = latestStatus.environment_url || latestStatus.target_url || undefined;` with a call to the helper; respect `shouldKeepPolling` when deciding whether to reschedule even if status is terminal (`deployed`)
- `pollSessionDeploymentStatus` around line 487: same change

Reschedule logic update: currently only reschedules when `!isTerminalDeploymentStatus(mappedStatus)`. Add: also reschedule when `shouldKeepPolling` is true. Upper bound stays `MAX_POLL_ATTEMPTS = 20`.

### No schema changes

- `agentRuns.deploymentUrl` and `sessions.deploymentUrl` fields remain unchanged — they just hold a different string (stable alias vs per-commit).
- Projects: no new fields; `getLatestDeploymentByProject` (agentRuns.ts:303-350) keeps working because all runs in a project share the project branch → all their `deploymentUrl` values converge to the same stable alias.

### No UI changes

`TaskFooter.tsx`, `StatusFieldsSection.tsx`, `ProjectDetailClient.tsx`, `ChatPanel.tsx` all read `deploymentUrl` as an opaque string — they don't care whether it's per-commit or stable.

## Key reused code

- `resolveAllEnvVars(ctx, repoId)` (`envVarResolver.ts:9`) — read encrypted team/repo env vars, decrypt, merge (repo overrides team). Returns sandbox-excluded vars too, which is what we want (token should NOT be injected into sandbox).
- `getInstallationOctokit` (`githubAuth.ts:78`) — unchanged, still used for GitHub Deployment lookup
- `mapGitHubDeploymentState` (`taskWorkflowActions.ts:231`) — unchanged
- `MAX_POLL_ATTEMPTS` / `POLL_INTERVAL_MS` (`taskWorkflowActions.ts:226-227`) — unchanged
- Existing scheduler pattern `ctx.scheduler.runAfter(POLL_INTERVAL_MS, …)` — unchanged

## Why this fixes the hash-truncation bug

Vercel's API returns the final resolvable alias string exactly as Vercel assigned it — if Vercel had to truncate+hash the subdomain to fit 63 chars, the response contains the truncated+hashed form. We never compute the hash ourselves, so there's no determinism problem.

## Verification

1. Create Vercel token (Account Settings → Tokens, scope to team) → add `VERCEL_TOKEN` + `VERCEL_TEAM_ID` via platform team env vars UI at `/{owner}/{repo}/settings/env-variables?tab=team`, both flagged `sandboxExclude: true`
2. `cd packages/backend && npx convex codegen --typecheck enable` — types clean
3. Kick off a quick task → Convex logs should show `[deployment-poll]` line with a `*-git-*.vercel.app` URL, not `*-{hash}.vercel.app`
4. Push a second commit to the same branch → DB `deploymentUrl` unchanged; status cycles `building → deployed`; preview button opens the same URL and loads the new build
5. Project with multiple tasks → all runs' `deploymentUrl` values equal; `getLatestDeploymentByProject` returns that same stable URL
6. Remove `VERCEL_TOKEN` from team env vars → confirm poller falls back to per-commit URL immediately (no crash, UI still shows a button — graceful degrade to today's behavior)
7. Long branch name (forces Vercel hash-truncation) → confirm returned alias resolves in a browser (proves we're reading Vercel's authoritative form, not constructing it)
8. Inspect a sandbox's process env → confirm `VERCEL_TOKEN` is absent (proves `sandboxExclude` is respected)

## Unresolved

None — all four clarifying questions answered (Vercel API, `-git-` branch alias, fall back to per-commit after 20 attempts, project reads from project branch via run convergence).
