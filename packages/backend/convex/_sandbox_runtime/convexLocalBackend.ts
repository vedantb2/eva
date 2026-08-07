/**
 * Pin local Convex backend binaries for Vercel sandboxes.
 *
 * Vercel Sandbox is Amazon Linux 2023 (glibc 2.34). Convex linux-gnu
 * precompiles from `precompiled-2026-07-15-*` onward require GLIBC_2.35
 * (`libm.so.6`), so `npx convex dev` dies before writing `CONVEX_DEPLOYMENT`.
 * Pin binary must be ≤ 2026-07-14 (ELF VERNEED max GLIBC_2.34).
 *
 * CarePulse uses anonymous mode, which rejects `--local-backend-version`. We
 * download a known-good binary and plant it into the CLI cache directory named
 * after "latest" so the cache hit serves our binary. The sandbox often gets
 * 403 from version.convex.dev (urllib), while the Convex CLI still resolves
 * latest successfully — so we always also plant under
 * EXPECTED_LATEST_CONVEX_LOCAL_BACKEND_VERSION.
 */
export const PINNED_CONVEX_LOCAL_BACKEND_VERSION =
  "precompiled-2026-07-14-7b3d1a5";

/** Cache label the CLI currently treats as latest (from version.convex.dev). */
export const EXPECTED_LATEST_CONVEX_LOCAL_BACKEND_VERSION =
  "precompiled-2026-07-21-82d5e9f";

const LINUX_X64_ARTIFACT = "convex-local-backend-x86_64-unknown-linux-gnu.zip";

/** True when the command likely starts or talks to a local Convex backend. */
export function isConvexBackendCommand(command: string): boolean {
  return /\bconvex\b/i.test(command);
}

/** Local backend health endpoint (anonymous mode serves the cloud API here). */
export const CONVEX_LOCAL_BACKEND_HEALTH_URL = "http://127.0.0.1:3210/version";

/**
 * Log line `convex dev` prints once functions are deployed and serving — the
 * readiness signal eva's native watcher greps for in `/tmp/bg-<i>.log`, so
 * repos no longer need hand-rolled grep loops in their startupCommands.
 */
export const CONVEX_FUNCTIONS_READY_LOG_LINE = "Convex functions ready";

/**
 * Wedge signature `convex dev` prints while it cannot reach the local backend.
 * Cloud-mode `convex dev` never prints this, so its presence in the bg log
 * confirms the command runs a LOCAL backend before the supervisor kills it.
 */
const CONVEX_LOCAL_BACKEND_WEDGE_LOG_LINE =
  "Unable to pull deployment config from http://127.0.0.1:3210";

/**
 * Self-heal supervisor around a `convex dev` background command.
 *
 * `convex dev` wedges permanently when convex-local-backend misses its startup
 * window (CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS, 240s for CarePulse) on a
 * busy resume: it stops respawning the backend and retries HTTP against :3210
 * forever, leaving the preview with a dead backend (observed 2026-07-23,
 * sandbox plum-serious-fowl-oA1Ym4). The supervisor launches the command in
 * its own process group, waits for the health endpoint, and on a confirmed
 * wedge kills the whole tree and relaunches — up to 3 attempts.
 *
 * Exit conditions mirror the pre-supervisor behaviour so the /tmp/bg-<i>.pid
 * liveness contract is unchanged: once healthy (or on any non-wedge outcome)
 * the wrapper just `wait`s on the command, and exits when it exits.
 */
function buildConvexSupervisorLines(command: string): string[] {
  return [
    // The command goes through a file (not inline quoting) so any user quoting
    // survives, and `setsid` can give it a killable process group of its own.
    `cat > "/tmp/eva-convex-bg-cmd-$$.sh" <<'EVA_CONVEX_BG_CMD'`,
    command,
    "EVA_CONVEX_BG_CMD",
    // Wrapper stdout is the /tmp/bg-<i>.log the launcher redirected us into.
    `eva_bg_log=$(readlink "/proc/$$/fd/1" 2>/dev/null || echo /dev/null)`,
    "eva_attempt=1",
    "while true; do",
    `  setsid bash -l "/tmp/eva-convex-bg-cmd-$$.sh" &`,
    "  eva_child=$!",
    '  eva_verdict=""',
    "  eva_waited=0",
    "  while [ $eva_waited -lt 300 ]; do",
    "    sleep 5; eva_waited=$((eva_waited+5))",
    '    kill -0 "$eva_child" 2>/dev/null || { eva_verdict=exited; break; }',
    `    curl -sf -m 3 ${CONVEX_LOCAL_BACKEND_HEALTH_URL} >/dev/null 2>&1 && { eva_verdict=healthy; break; }`,
    "  done",
    // Healthy or exited on its own: behave exactly like the unsupervised
    // launch — babysit the pid and end with it.
    '  if [ -n "$eva_verdict" ]; then',
    '    [ "$eva_verdict" = healthy ] && echo "[eva-supervisor] local backend healthy after ${eva_waited}s"',
    '    wait "$eva_child" 2>/dev/null',
    "    exit 0",
    "  fi",
    // Grace elapsed, still running, :3210 down. Only a LOCAL backend command
    // that logged the wedge signature is restarted; anything else (cloud-mode
    // convex dev, non-backend convex tooling) is left alone.
    `  if ! grep -q "${CONVEX_LOCAL_BACKEND_WEDGE_LOG_LINE}" "$eva_bg_log" 2>/dev/null; then`,
    '    wait "$eva_child" 2>/dev/null',
    "    exit 0",
    "  fi",
    "  if [ $eva_attempt -ge 3 ]; then",
    '    echo "[eva-supervisor] local backend still down after 3 attempts; leaving convex dev running"',
    '    wait "$eva_child" 2>/dev/null',
    "    exit 0",
    "  fi",
    '  echo "[eva-supervisor] local backend not healthy after ${eva_waited}s — restarting convex dev (attempt $eva_attempt/3)"',
    '  kill -TERM -- "-$eva_child" 2>/dev/null || true',
    "  sleep 2",
    '  kill -KILL -- "-$eva_child" 2>/dev/null || true',
    "  pkill -KILL -f '[c]onvex-local-backend' 2>/dev/null || true",
    "  eva_attempt=$((eva_attempt+1))",
    "  sleep 3",
    "done",
  ];
}

/**
 * Shell script body for launching a Convex-related background command.
 *
 * Unsets CONVEX_AGENT_MODE, plants a glibc-compatible backend binary under the
 * CLI's "latest" cache label(s), aligns .convex config.json so non-TTY convex
 * dev skips auto-upgrade, then runs the original command under the self-heal
 * supervisor (see buildConvexSupervisorLines).
 */
export function buildConvexBackgroundScriptBody(command: string): string {
  const pinLiteral = JSON.stringify(PINNED_CONVEX_LOCAL_BACKEND_VERSION);
  const expectedLatestLiteral = JSON.stringify(
    EXPECTED_LATEST_CONVEX_LOCAL_BACKEND_VERSION,
  );
  const artifactLiteral = JSON.stringify(LINUX_X64_ARTIFACT);
  return [
    "unset CONVEX_AGENT_MODE",
    "python3 - <<'PY'",
    "import glob, json, os, pathlib, shutil, subprocess, tempfile, urllib.request, zipfile",
    `PIN = ${pinLiteral}`,
    `EXPECTED_LATEST = ${expectedLatestLiteral}`,
    `ARTIFACT = ${artifactLiteral}`,
    "def fetch_latest():",
    "  # Prefer curl — sandbox urllib often gets 403 from version.convex.dev.",
    "  try:",
    "    out = subprocess.check_output(",
    "      ['curl', '-fsSL', '-H', 'Convex-Client: npm-cli-1.40.0',",
    "       'https://version.convex.dev/v1/local_backend_version'],",
    "      text=True, timeout=30,",
    "    )",
    "    return json.loads(out)['version']",
    "  except Exception as e:",
    "    print(f'curl version api failed ({e})')",
    "  try:",
    "    req = urllib.request.Request(",
    "      'https://version.convex.dev/v1/local_backend_version',",
    "      headers={'Convex-Client': 'npm-cli-1.40.0', 'User-Agent': 'eva-sandbox-pin'},",
    "    )",
    "    with urllib.request.urlopen(req, timeout=30) as resp:",
    "      return json.load(resp)['version']",
    "  except Exception as e:",
    "    print(f'urllib version api failed ({e})')",
    "  return None",
    "fetched = fetch_latest()",
    "latest = fetched or EXPECTED_LATEST",
    "print(f'convex local backend: fetched={fetched} plant_as={latest} pin_binary={PIN}')",
    "labels = {PIN, EXPECTED_LATEST, latest}",
    "cache_roots = []",
    "for root in (",
    "  os.path.expanduser('~/.cache/convex/binaries'),",
    "  '/home/vercel-sandbox/.cache/convex/binaries',",
    "  '/tmp/cursor-home/.cache/convex/binaries',",
    "):",
    "  if root not in cache_roots:",
    "    cache_roots.append(root)",
    "url = f'https://github.com/get-convex/convex-backend/releases/download/{PIN}/{ARTIFACT}'",
    "with tempfile.TemporaryDirectory() as td:",
    "  zpath = os.path.join(td, ARTIFACT)",
    "  print(f'downloading {url}')",
    "  urllib.request.urlretrieve(url, zpath)",
    "  with zipfile.ZipFile(zpath) as zf:",
    "    zf.extractall(td)",
    "  matches = list(pathlib.Path(td).rglob('convex-local-backend'))",
    "  if not matches:",
    "    raise SystemExit(f'pin zip missing convex-local-backend: {os.listdir(td)}')",
    "  src = str(matches[0])",
    "  for cache_root in cache_roots:",
    "    for label in sorted(labels):",
    "      try:",
    "        os.makedirs(cache_root, exist_ok=True)",
    "        dest_dir = os.path.join(cache_root, label)",
    "        os.makedirs(dest_dir, exist_ok=True)",
    "        exec_path = os.path.join(dest_dir, 'convex-local-backend')",
    "        marker = os.path.join(dest_dir, '.eva-glibc-pin')",
    "        if os.path.isfile(exec_path) and os.path.isfile(marker) and open(marker).read().strip() == PIN:",
    "          print(f'already planted {exec_path}')",
    "          continue",
    "        shutil.copy2(src, exec_path)",
    "        os.chmod(exec_path, 0o755)",
    "        open(marker, 'w').write(PIN + '\\n')",
    "        print(f'planted {exec_path}')",
    "      except Exception as e:",
    "        print(f'skip cache {cache_root}/{label}: {e}')",
    "for p in glob.glob('/tmp/repo/**/.convex/**/config.json', recursive=True):",
    "  try:",
    "    with open(p) as f: cfg=json.load(f)",
    "    if cfg.get('backendVersion') == latest: continue",
    "    cfg['backendVersion']=latest",
    "    with open(p,'w') as f: json.dump(cfg,f)",
    "    print(f'aligned {p} -> {latest}')",
    "  except Exception as e:",
    "    print(f'skip {p}: {e}')",
    "PY",
    ...buildConvexSupervisorLines(command),
  ].join("\n");
}
