# Custom MCP servers per repo

Goal: let a repo register external MCP servers (Linear, Figma, PostHog, …) that get injected into every sandbox agent's MCP config alongside the built-in `eva` server. Motivation: session 33 ("Sequentially fix Linear issues via MCPs") — agent had only eva MCP, fell back to raw GraphQL with `LINEAR_API_KEY`.

## Current state (anchors)

- Single MCP config written at launch: [launch.ts:172-187](../../packages/backend/convex/_daytona/launch.ts) — hardcoded `mcpServers: { eva: { type: "http", url, headers } }` → `/tmp/eva-mcp.json`.
- All providers consume that one file: claude sdk (`--mcp-config /tmp/eva-mcp.json`, [claudeSdk.ts:34](../../packages/backend/callback-src/providers/claudeSdk.ts)), claude one-shot ([config.ts:252](../../packages/backend/callback-src/config.ts)), cursor (translates file → `~/.cursor/mcp.json` + `--approve-mcps`, [cursorSession.ts:35-77](../../packages/backend/callback-src/session/cursorSession.ts)).
- Secrets already resolvable per repo/team: `resolveAllEnvVars(ctx, repoId)` ([envVarResolver.ts](../../packages/backend/convex/envVarResolver.ts)).
- `signAndLaunchScript` ([helpers.ts](../../packages/backend/convex/_daytona/helpers.ts)) has `ctx` + `repoId`; `launchScript` does not — custom servers must resolve there and pass through opts.

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
4. `launchScript` (launch.ts:172): merge into the JSON — `mcpServers: { eva: {...}, ...custom }`. Written only when mcp enabled (keep current gate).
5. Prompt: append one line to session/task/project chat prompts listing connected server names ("Connected MCP servers: eva, linear, figma") so agents discover them. Optional v1.

### Callback (verify, likely zero changes)

- claude: `--mcp-config` passes whole file — works as-is.
- cursor: confirm cursorSession.ts translation copies ALL entries (it parses the file; check it doesn't cherry-pick `eva`). `--approve-mcps` already auto-approves.
- codex/opencode: check whether they consume `/tmp/eva-mcp.json` at all; if not, note gap in tool descriptions (out of scope to add).
- If any callback change needed → rebuild `callbackScript.generated.ts` (`node scripts/build-callback-script.mjs`).

### Web UI

- Repo settings surface (same page family as env vars settings — locate `envVars` settings route and co-locate): list + add/edit/remove custom servers. Fields: name, url, headers (key/value rows, hint about `${ENV_NAME}` substitution + link to env vars tab). Simple table + dialog, HeroUI border style.
- Validation: name slug regex, url https required in prod, reserved name `eva`.

### Security notes

- Substituted secrets land in `/tmp/eva-mcp.json` inside the sandbox — same trust level as existing provider keys/mcpToken already in sandbox env. Acceptable.
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
