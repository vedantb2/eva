# Custom MCP servers per repo

Goal: let a repo register external MCP servers (Linear, Figma, PostHog, …) that get injected into every sandbox agent's MCP config alongside the built-in `eva` server. Motivation: session 33 ("Sequentially fix Linear issues via MCPs") — agent had only eva MCP, fell back to raw GraphQL with `LINEAR_API_KEY`.

## Current state (anchors)

- Eva MCP auth reaches the callback through reserved launch environment variables; [evaMcp.ts](../../packages/backend/callback-src/evaMcp.ts) consumes them into one typed in-memory server record and removes them before agent tools spawn.
- Claude and Cursor pass that record directly through their SDK `mcpServers` options; no MCP JSON file is written.
- Secrets already resolvable per repo/team: `resolveAllEnvVars(ctx, repoId)` ([envVarResolver.ts](../../packages/backend/convex/envVarResolver.ts)).
- `signAndLaunchScript` ([helpers.ts](../../packages/backend/convex/_sandbox_runtime/helpers.ts)) has `ctx` + `repoId`; `launchScript` does not — custom servers must resolve there and pass through opts.

## Design

### Schema

New table `repoMcpServers` (fields in `_validators/tableFields.ts` per convention):

- `repoId: v.id("githubRepos")`, index `by_repo`
- `name: v.string()` — slug, becomes the key in `mcpServers` (reject `eva`, dedupe per repo)
- `url: v.string()` — http(s) endpoint; v1 = `type: "http"` only (stdio/command servers: out of scope, sandbox image can't install arbitrary binaries safely)
- `headers: v.optional(v.array(v.object({ key: v.string(), value: v.string() })))` — value supports `${ENV_NAME}` placeholders substituted from resolved repo/team env vars at launch (secret never stored twice)
- `enabled: v.boolean()`, `createdAt`/`updatedAt`

### Backend

1. CRUD in new `convex/repoMcpServers.ts`: `listByRepo` (authQuery, repo access check), `upsert`, `remove` (authMutations). Mask nothing — header values are templates, not secrets.
2. Internal `resolveForLaunch(repoId)` internalQuery: enabled servers for repo.
3. `signAndLaunchScript`: when `opts.enableMcp !== false`, fetch servers + `resolveAllEnvVars`, substitute `${VAR}` in header values (missing var → skip server + console.warn, do not fail launch), pass `customMcpServers` through to `launchScript` opts.
4. Merge future servers into the callback's in-memory `mcpServers` record for each SDK, not a JSON file.
5. Prompt: append one line to session/task/project chat prompts listing connected server names ("Connected MCP servers: eva, linear, figma") so agents discover them. Optional v1.

### Callback

- Extend the shared in-memory MCP boundary so Claude and Cursor receive every resolved server in their SDK-native shapes.
- Codex/OpenCode do not consume Eva MCP today; adding them remains out of scope.
- If any callback change needed → rebuild `callbackScript.generated.ts` (`node scripts/build-callback-script.mjs`).

### Web UI

- Repo settings surface (same page family as env vars settings — locate `envVars` settings route and co-locate): list + add/edit/remove custom servers. Fields: name, url, headers (key/value rows, hint about `${ENV_NAME}` substitution + link to env vars tab). Simple table + dialog, HeroUI border style.
- Validation: name slug regex, url https required in prod, reserved name `eva`.

### Security notes

- Substituted secrets must remain in callback memory and be removed from inherited child-process environments after consumption.
- OAuth-flow MCP servers (e.g. Linear's hosted OAuth mode) NOT supported v1 — header/API-key auth only. Document in UI hint.
- Data minimisation: header templates in Convex, real values only in team/repo env vars.

### Tests

- Unit: `${VAR}` substitution (hit, missing var skip, multiple vars).
- Codegen typecheck + existing launch tests.

### Steps

1. Schema + CRUD + resolveForLaunch
2. Launch merge (helpers.ts → launch.ts opts)
3. Verify cursor translation copies all servers (fix if not; rebuild generated script)
4. Repo settings UI
5. Prompt discovery line
6. `npx convex codegen --typecheck enable`, vitest, web tsc
7. Run /ship skill

## Unresolved questions

1. Scope: per-repo only, or also team-level servers inherited by all repos (like team env vars)? Plan assumes per-repo v1.
2. Should servers be per-app (rootDirectory repo docs are separate `githubRepos` rows — eprocurement vs web) or shared across the GitHub repo? Per `githubRepos` row is the code-natural default but means duplicate setup per app.
3. Gate by entity type? (sessions/tasks/projects all get them, or sessions only?) Plan assumes all chat surfaces where `enableMcp` is true.
4. Cursor `--approve-mcps` auto-approves ALL servers incl. custom — acceptable, or want per-server allowlist for cursor?
5. Prompt discovery line in v1, or rely on CLI tool listing?
