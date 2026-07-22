/**
 * Pin local Convex backend binaries for Vercel sandboxes.
 *
 * `version.convex.dev` currently serves `precompiled-2026-07-21-82d5e9f`, which
 * requires GLIBC_2.35. Vercel sandbox images ship an older glibc, so
 * `npx convex dev` dies before writing `CONVEX_DEPLOYMENT` and seed startups
 * fail (`No CONVEX_DEPLOYMENT set` / never reaches "Convex functions ready").
 *
 * Pin to the last known-good precompiled release. Bump this when the sandbox
 * image or Convex binary supports the newer glibc floor.
 */
export const PINNED_CONVEX_LOCAL_BACKEND_VERSION =
  "precompiled-2026-07-20-c4dfbcf";

/** True when the command likely starts or talks to a local Convex backend. */
export function isConvexBackendCommand(command: string): boolean {
  return /\bconvex\b/i.test(command);
}

/**
 * Inject `--local-backend-version <pin>` into `convex dev` invocations so the
 * CLI downloads the pinned binary instead of "latest" from version.convex.dev.
 */
export function withPinnedLocalBackendVersion(command: string): string {
  if (command.includes("--local-backend-version")) {
    return command;
  }
  return command.replace(
    /\b((?:npx\s+)?convex\s+dev)\b/g,
    `$1 --local-backend-version ${PINNED_CONVEX_LOCAL_BACKEND_VERSION}`,
  );
}

/**
 * Shell script body for launching a Convex-related background command.
 *
 * Unsets CONVEX_AGENT_MODE (seeded login profiles export anonymous mode),
 * rewrites .convex config.json backendVersion to the pin so non-TTY convex
 * dev does not auto-upgrade (upgrade exports the whole DB and can hang
 * CarePulse eproc on large tables), then runs the pinned command.
 */
export function buildConvexBackgroundScriptBody(command: string): string {
  const pinnedCommand = withPinnedLocalBackendVersion(command);
  const versionLiteral = JSON.stringify(PINNED_CONVEX_LOCAL_BACKEND_VERSION);
  return [
    "unset CONVEX_AGENT_MODE",
    "python3 - <<'PY'",
    "import glob, json",
    `PIN = ${versionLiteral}`,
    "for p in glob.glob('/tmp/repo/**/.convex/**/config.json', recursive=True):",
    "  try:",
    "    with open(p) as f: cfg=json.load(f)",
    "    if cfg.get('backendVersion') == PIN: continue",
    "    cfg['backendVersion']=PIN",
    "    with open(p,'w') as f: json.dump(cfg,f)",
    "    print(f'pinned {p} -> {PIN}')",
    "  except Exception as e:",
    "    print(f'skip {p}: {e}')",
    "PY",
    pinnedCommand,
  ].join("\n");
}
