# Editor TypeScript performance (tsgo in Cursor)

Traced 07 Aug 2026. Cursor's tsserver climbs to ~7 GB on this repo. It is real
workload, not a leak: `packages/backend/convex/_generated/api.d.ts` declares
`api`/`internal` as `FilterApi<typeof fullApi, ...>` over ~100 modules, and each
`internal.*` reference forces TypeScript to expand every function's inferred
type, including Zod schemas (~5 s per fresh check of `api.d.ts:695`).

Measured with `tsc --noEmit --extendedDiagnostics`:

| Project | Memory | Types | Instantiations |
| --- | --- | --- | --- |
| apps/web | 1.9 GB | 1.01M | 6.7M |
| packages/backend (convex) | 1.4 GB | 794K | 5.5M |

Worst single path: `internal.mcp.nodeActions` → `convex/mcp/nodeActions.ts:728`.

## Fix in use: tsgo (TypeScript 7 native) as the editor language server

End state (verified 08 Aug 2026): tsgo ~3.2 GB replaces the ~7 GB JS tsserver;
the built-in tsserver drops to two ~64 MB syntax-only helpers.

Cursor cannot install the official `TypeScriptTeam.native-preview` extension
(it is Microsoft-marketplace only; Cursor uses Open VSX). We use the Open VSX
re-publish **`Nsttt.native-preview`** instead. THREE things must all hold:

1. **Patch the fork after install.** Its `package.json` ships
   `"engines": {"vscode": "*"}`, which Cursor's extension scanner REJECTS
   ("not specific enough") — the extension sits on disk but never loads, with
   no visible error. Edit
   `~/.cursor/extensions/nsttt.native-preview-*/package.json` →
   `"engines": {"vscode": "^1.0.0"}`, then fully restart Cursor.
   (Same trick as the community gist for the official VSIX.)
2. **Keep the deprecated key.** The fork only reads
   `typescript.experimental.useTsgo` (verified: zero `js/ts` references in its
   `dist/extension.bundle.js`). Cursor strikes it through as deprecated — it is
   load-bearing anyway.
3. **Also set the new key.** Cursor's built-in TS extension only understands
   `js/ts.experimental.useTsgo`; without it the built-in keeps running its own
   full-semantic tsserver ALONGSIDE tsgo and you pay ~9 GB for both engines.

```json
"typescript.experimental.useTsgo": true,  // starts the fork's tsgo (deprecated name, load-bearing)
"js/ts.experimental.useTsgo": true        // makes Cursor's built-in TS stand down to syntax-only
```

Verify with Task Manager / `Get-Process tsgo`: one tsgo.exe (~3 GB), tsserver
processes all small (<200 MB). A multi-GB node process means one of the three
points above regressed. Once the fork updates, or Cursor gains the official
extension, the patch and the deprecated key can go.

tsgo memory can be capped further via the extension's
`typescript.native-preview.goMemLimit` setting if needed.

## Future option: shrink the type graph itself

Explicit return types on the hottest Convex functions stop tsserver/tsc from
inferring handler bodies into the api type. Trace-ranked candidates:
`mcp/nodeActions.ts`, `_queues/helpers.ts`, `_projects/prSync.ts`,
`functions.ts`, `notifications.ts`. Only worth doing if plain `tsc` (CI,
non-tsgo editors) becomes a bottleneck.
