/**
 * Pin local Convex backend binaries for Vercel sandboxes.
 *
 * `version.convex.dev` serves `precompiled-2026-07-21-82d5e9f`, which requires
 * GLIBC_2.35. Vercel sandbox images ship an older glibc, so `npx convex dev`
 * dies before writing `CONVEX_DEPLOYMENT`.
 *
 * CarePulse uses anonymous mode, which rejects `--local-backend-version`. We
 * download a known-good binary and plant it into the CLI cache directory named
 * after "latest" so the cache hit serves our binary. The sandbox often gets
 * 403 from version.convex.dev (urllib), while the Convex CLI still resolves
 * latest successfully — so we always also plant under
 * EXPECTED_LATEST_CONVEX_LOCAL_BACKEND_VERSION.
 */
export const PINNED_CONVEX_LOCAL_BACKEND_VERSION =
  "precompiled-2026-07-20-c4dfbcf";

/** Cache label the CLI currently treats as latest (from version.convex.dev). */
export const EXPECTED_LATEST_CONVEX_LOCAL_BACKEND_VERSION =
  "precompiled-2026-07-21-82d5e9f";

const LINUX_X64_ARTIFACT = "convex-local-backend-x86_64-unknown-linux-gnu.zip";

/** True when the command likely starts or talks to a local Convex backend. */
export function isConvexBackendCommand(command: string): boolean {
  return /\bconvex\b/i.test(command);
}

/**
 * Shell script body for launching a Convex-related background command.
 *
 * Unsets CONVEX_AGENT_MODE, plants a glibc-compatible backend binary under the
 * CLI's "latest" cache label(s), aligns .convex config.json so non-TTY convex
 * dev skips auto-upgrade, then runs the original command unchanged.
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
    command,
  ].join("\n");
}
