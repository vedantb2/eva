# MCP rework: token via EVA_MCP_AUTH env var (no eva-mcp.json)

**Status:** todo

## Context

Today every launch bakes a live 8h MCP bearer JWT into `/tmp/eva-mcp.json` (rewritten per launch). Consumers:

| Consumer | How it uses the file today |
| -------- | -------------------------- |
| Claude Agent SDK (`claudeSdk.ts`) | `existsSync` → `extraArgs["mcp-config"]` |
| Cursor ACP (`cursorAcpRuntime.ts` → `readCursorAcpMcpServers`) | Parse file → pass `mcpServers[]` **in memory** to ACP (no `.cursor/mcp.json` write) |
| Startup log (`config.ts` `hasMcpConfig`) | `existsSync("/tmp/eva-mcp.json")` |

Problems:

1. Secret at rest in the sandbox FS (snapshot-capturable).
2. Stale token file from a prior launch leaks MCP into `enableMcp:false` audit/proof runs — Claude gates on `existsSync` only; Cursor ACP likewise reads the leftover file.
3. (Historical / stale plans) Older docs claimed Cursor wrote git-tracked `.cursor/mcp.json`. **Current ACP path does not** — do not reintroduce a file.

Rework (confirmed): supply the token as env vars; Claude gets the eva server via Agent SDK `options.mcpServers` (docs: `type:"http"` + `headers`; SDK pinned `0.3.201`); Cursor ACP builds the same in-memory list from env. No `/tmp/eva-mcp.json` at all.

## Decisions

| Decision | Choice |
| -------- | ------ |
| Token transport | `EVA_MCP_AUTH` + `EVA_MCP_BASE_URL` env (exported in launch runner) |
| Claude | In-memory `mcpServers` on SDK options — no mcp.json / `--mcp-config` |
| Cursor | Rewrite `readCursorAcpMcpServers()` from env — keep ACP in-memory path |
| File cleanup | `rm -f /tmp/eva-mcp.json` on every launch (legacy sandboxes) |
| Mint / enableMcp | Unchanged — `helpers.ts` / `sandboxJwt.ts` / audit / proof |
| `strictMcpConfig` | Do **not** set — keep additive merge with repo `.mcp.json` |

## Changes

### 1. `packages/backend/convex/_sandbox_runtime/launch.ts`

- Delete the `/tmp/eva-mcp.json` build+upload block (~lines 180–195).
- After the `extraEnvVars` loop and next to `CALLBACK_SCRIPT_FP` push (so user/repo env can never shadow):

```ts
if (opts.mcpBaseUrl && opts.mcpToken) {
  envParts.push(`EVA_MCP_AUTH=${quote([opts.mcpToken])}`);
  envParts.push(`EVA_MCP_BASE_URL=${quote([opts.mcpBaseUrl])}`);
}
```

- Add `"rm -f /tmp/eva-mcp.json",` to `runnerLaunchScript` beside existing `rm -f /tmp/run-design.pid ...` (~line 281).
- `opts.mcpToken` / `opts.mcpBaseUrl` signature unchanged → `helpers.ts`, `sandboxJwt.ts`, `execution.ts`, `audit.ts`, `proof.ts` untouched.

### 2. `packages/backend/callback-src/providers/claudeSdk.ts`

- Remove `MCP_CONFIG_PATH` and the `existsSync` gate in `buildSdkOptions` (~lines 34, 173–175). Drop unused `existsSync` import only if no other uses remain in the file (`loadSdk` / `claudeExecutablePath` still need it).
- Add to `SdkOptions`:

```ts
mcpServers?: Record<
  string,
  { type: "http"; url: string; headers: Record<string, string> }
>;
```

- In `buildSdkOptionsFromParts`, mirror the `effortOption` pattern:

```ts
const mcpAuth = process.env.EVA_MCP_AUTH;
const mcpBase = process.env.EVA_MCP_BASE_URL;
const mcpServersOption =
  mcpAuth && mcpBase
    ? {
        mcpServers: {
          eva: {
            type: "http",
            url: `${mcpBase}/mcp`,
            headers: { Authorization: `Bearer ${mcpAuth}` },
          },
        },
      }
    : {};
```

Spread into the returned object. One-shot attempts (~313/386) and warm daemon (`claudeSdkDaemon.ts` → `buildSdkOptions`) all go through this.

### 3. `packages/backend/callback-src/providers/cursorAcpRuntime.ts`

Replace `readCursorAcpMcpServers()` body (~84–123). Do **not** touch `cursorSession.ts` (no MCP file hydrate there today).

```ts
export function readCursorAcpMcpServers(): McpServer[] {
  const auth = process.env.EVA_MCP_AUTH;
  const base = process.env.EVA_MCP_BASE_URL;
  if (!auth || !base) return [];
  return [
    {
      type: "http",
      name: "eva",
      url: `${base}/mcp`,
      headers: [{ name: "Authorization", value: `Bearer ${auth}` }],
    },
  ];
}
```

Call sites stay as-is (`attempts.ts`, `cursorAcpDaemon.ts`). Drop now-unused `readFileSync` / `tryParseJson` imports from this file if nothing else needs them (`existsSync` still used for bin path etc.).

No `.cursor/mcp.json` write. No `.git/info/exclude` change.

### 4. `packages/backend/callback-src/config.ts`

```ts
/** True when Eva MCP auth env is present (startup logging). */
export const hasMcpConfig = Boolean(
  process.env.EVA_MCP_AUTH && process.env.EVA_MCP_BASE_URL,
);
```

Keep `existsSync` import — still used for `WORK_DIR`, CLI bin paths, etc.

### 5. Rebuild bundle (mandatory)

```bash
node packages/backend/scripts/build-callback-script.mjs
```

Regenerates `convex/_sandbox_runtime/callbackScript.generated.ts` (never hand-edit). Commit it.

### 6. Docs

- `packages/backend/docs/ARCHITECTURE.md` §5 — env-var + in-memory `mcpServers` / ACP list; fix stale `_daytona` path refs to `_sandbox_runtime`.
- `internal/plans/todo/custom-mcp-servers.md` — refresh “current state” anchors (no `/tmp/eva-mcp.json`; Claude/Cursor both env → in-memory). Note future custom servers merge into the in-memory `mcpServers` object / ACP list, not a JSON file.

## Notes / risks

- Token freshness unchanged: env exported per `launchScript` call — same cadence as today’s file rewrite. Warm daemons keep spawn-time token, bounded by Vercel VM max runtime &lt; 8h TTL.
- Secret still sits in the `export` line of `/tmp/eva-launch-runner.sh` — same exposure class as existing `CONVEX_TOKEN`; net win is removing the second durable JSON copy.
- Bundle fingerprint changes → old warm daemons respawn on next launch; launch.ts + bundle deploy atomically (same Convex deploy), no version skew.
- Smoke-test: programmatic Claude `mcpServers` still merges with a repo `.mcp.json` when present (do not set `strictMcpConfig`).
- Codex / OpenCode do not consume Eva MCP today — out of scope.

## Verification

1. Rebuild bundle; grep `callbackScript.generated.ts`: zero `eva-mcp.json` refs; `EVA_MCP_AUTH` / `EVA_MCP_BASE_URL` reads present.
2. Repo-wide grep `eva-mcp.json` — only changelog / historical notes remain (not live code).
3. `cd packages/backend && npx convex codegen --typecheck enable` (if types touched).
4. Deploy backend to `dev:good-mule-506`, run a real Claude session turn: `mcp__eva__*` tools connect; confirm `/tmp/eva-mcp.json` absent in the sandbox.
5. Audit/proof run (`enableMcp:false`) on a reused sandbox: no eva MCP attempted; legacy file gone.
6. Cursor ACP session: tools connect; no `.cursor/mcp.json` created for Eva.
7. Optional: repo with `.mcp.json` — both eva + repo servers available on Claude.
8. `/changelog`, then `/ship`.

## Unresolved questions

None — approach confirmed; Cursor section corrected against current ACP code.
