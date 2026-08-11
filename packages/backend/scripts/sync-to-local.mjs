#!/usr/bin/env node
// Replaces a LOCAL Convex backend's data with a snapshot from a cloud deployment.
//
// Runs with no `convex login`:
//   Source auth — the deployment-scoped deploy key you pass is injected as
//   CONVEX_DEPLOY_KEY into the export child process. dotenv never overrides an
//   existing value and the deploy key is read before CONVEX_DEPLOYMENT, so the key
//   wins over whatever the app's .env.local holds.
//
//   Target auth — `--url` + `--admin-key`, read off the local deployment's
//   config.json. Those two flags together make the CLI skip every env var,
//   including auth (convex/src/cli/lib/deploymentSelection.ts,
//   `_getDeploymentSelection`), so the local backend is addressed directly.
//
// The import is `--replace-all`, so the target is guarded twice: the resolved URL
// must be loopback, and the backend must already answer on /instance_name.
//
// A snapshot carries documents, plus file storage with --include-storage. It does
// not carry env vars (hence --include-env), pending scheduled functions, or code.
//
// Snapshots hold real client data. The zip is deleted after a successful import
// unless --keep-snapshot, and backups/ is gitignored. Never commit or share one.
//
//   node scripts/sync-to-local.mjs --deploy-key-file ../eva-prod.key
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// Apps this script can sync, as paths relative to the directory above `scripts/`.
// Cross-repo sharing would need a published package, so this file is a deliberate
// near-copy of carepulse-ts's scripts/sync-to-local.mjs. Only this block, the usage
// example above, and each repo's prettier formatting differ — keep any fix
// appliable to both by diffing them.
const APPS = {
  backend: ".",
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const isWindows = process.platform === "win32";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const appNames = Object.keys(APPS);

const USAGE = `
Sync a cloud Convex deployment into the local Convex backend.

  node scripts/sync-to-local.mjs --app <${appNames.join("|")}> --deploy-key-file <path>

  --app <name>              Which app to sync${appNames.length === 1 ? ` (default: ${appNames[0]})` : `: ${appNames.join(", ")}`}.
  --deploy-key-file <path>  File holding the source deployment's deploy key.
  --deploy-key <key>        Same key inline. Falls back to CONVEX_SOURCE_DEPLOY_KEY.
  --include-storage         Also export file storage. Off by default: slow and large.
  --include-env             Copy the source deployment's env vars onto the local one.
  --local-url <url>         Override the target URL (must be loopback).
  --local-admin-key <key>   Override the target admin key. Required with --local-url.
  --keep-snapshot           Keep the snapshot zip instead of deleting it.
`;

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      app: { type: "string" },
      "deploy-key": { type: "string" },
      "deploy-key-file": { type: "string" },
      "include-storage": { type: "boolean", default: false },
      "include-env": { type: "boolean", default: false },
      "local-url": { type: "string" },
      "local-admin-key": { type: "string" },
      "keep-snapshot": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: false,
  }));
} catch (error) {
  fail(`${error instanceof Error ? error.message : String(error)}\n${USAGE}`);
}

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

// --- app ---------------------------------------------------------------------

const appName = values.app ?? (appNames.length === 1 ? appNames[0] : undefined);
if (appName === undefined) {
  fail(`Pass --app with one of: ${appNames.join(", ")}`);
}
if (!Object.hasOwn(APPS, appName)) {
  fail(`Unknown --app "${appName}". Valid values: ${appNames.join(", ")}`);
}
const appDir = join(rootDir, APPS[appName]);
if (!existsSync(appDir)) {
  fail(`App directory not found: ${appDir}`);
}

// --- source key --------------------------------------------------------------

function readSourceKey() {
  if (values["deploy-key-file"] !== undefined) {
    const keyPath = resolve(values["deploy-key-file"]);
    if (!existsSync(keyPath)) {
      fail(`Deploy key file not found: ${keyPath}`);
    }
    return readFileSync(keyPath, "utf8").trim();
  }
  if (values["deploy-key"] !== undefined) {
    return values["deploy-key"].trim();
  }
  if (process.env.CONVEX_SOURCE_DEPLOY_KEY) {
    return process.env.CONVEX_SOURCE_DEPLOY_KEY.trim();
  }
  return fail(
    "No source deploy key. Pass --deploy-key-file <path>, --deploy-key <key>, or set CONVEX_SOURCE_DEPLOY_KEY.\n" +
      "Generate one in the Convex dashboard: the source deployment -> Settings -> Deploy keys.",
  );
}

const sourceKey = readSourceKey();
const keyPrefix = sourceKey.slice(0, sourceKey.indexOf("|"));

// A deployment-scoped key names its own deployment, which is the whole point: the
// key alone picks the source, so no deployment name is hardcoded here and no
// selector flag can redirect the export. Project and preview keys do not name one.
if (!/^(dev|prod):[^|]+$/.test(keyPrefix)) {
  const kind = sourceKey.startsWith("project:")
    ? "a project deploy key"
    : sourceKey.startsWith("preview:")
      ? "a preview deploy key"
      : "not a deployment deploy key";
  fail(
    `The source key is ${kind}, which does not name a single deployment.\n` +
      "Pass a deployment-scoped key (it starts with `dev:` or `prod:`, e.g. `prod:brave-tapir-123|...`)\n" +
      "from the Convex dashboard: the source deployment -> Settings -> Deploy keys.",
  );
}
const sourceName = keyPrefix.slice(keyPrefix.indexOf(":") + 1);

// --- local target ------------------------------------------------------------

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function targetFromLocalConfig(configPath) {
  const config = readJsonFile(configPath);
  if (config === null) {
    return null;
  }
  const port = config.ports?.cloud;
  const adminKey = config.adminKey;
  if (typeof port !== "number" || typeof adminKey !== "string") {
    return fail(
      `${configPath} does not look like a local deployment config (expected ports.cloud and adminKey).`,
    );
  }
  return {
    url: `http://127.0.0.1:${port}`,
    adminKey,
    name:
      typeof config.deploymentName === "string"
        ? config.deploymentName
        : "local",
    from: configPath,
  };
}

/** The deployment name in the app's .env.local, without its `dev:` / `anonymous:` prefix. */
function configuredDeploymentName() {
  const envPath = join(appDir, ".env.local");
  if (!existsSync(envPath)) {
    return null;
  }
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*CONVEX_DEPLOYMENT\s*=\s*"?([^"#\s]+)"?/.exec(line);
    if (match !== null) {
      return match[1].replace(/^[a-z]+:/, "");
    }
  }
  return null;
}

function resolveTarget() {
  const url = values["local-url"];
  const adminKey = values["local-admin-key"];
  if (url !== undefined || adminKey !== undefined) {
    if (url === undefined || adminKey === undefined) {
      return fail("--local-url and --local-admin-key must be passed together.");
    }
    return { url, adminKey, name: "override", from: "--local-url" };
  }

  // Where `npx convex dev` puts a local deployment's credentials.
  const projectLocal = targetFromLocalConfig(
    join(appDir, ".convex", "local", "default", "config.json"),
  );
  if (projectLocal !== null) {
    return projectLocal;
  }

  // Older CLI versions kept anonymous deployment state under the home directory.
  const deploymentName = configuredDeploymentName();
  if (deploymentName !== null) {
    const legacy = targetFromLocalConfig(
      join(
        homedir(),
        ".convex",
        "anonymous-convex-backend-state",
        deploymentName,
        "config.json",
      ),
    );
    if (legacy !== null) {
      return legacy;
    }
  }

  return fail(
    `No local Convex deployment found for ${appName}.\n` +
      `Start one first: cd ${appDir} && npx convex dev (while logged out of the Convex CLI),\n` +
      "then leave it running and re-run this script.\n" +
      "If the app's .env.local sets CONVEX_DEPLOY_KEY, comment it out first or `convex dev` will target that cloud deployment instead.",
  );
}

const target = resolveTarget();

// The import is destructive, so refuse anything that is not this machine.
let targetHost;
try {
  targetHost = new URL(target.url).hostname;
} catch {
  fail(`Target URL is not a valid URL: ${target.url}`);
}
if (!LOOPBACK_HOSTS.has(targetHost)) {
  fail(
    `Refusing to run: the target (${target.url}) is not a local backend.\n` +
      "This script only ever imports into 127.0.0.1 / localhost.",
  );
}

// A storage export can take a long time; check the target is up before starting.
try {
  const response = await fetch(`${target.url}/instance_name`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    fail(`${target.url}/instance_name returned ${response.status}.`);
  }
} catch (error) {
  fail(
    `No Convex backend answering at ${target.url} (${error instanceof Error ? error.message : String(error)}).\n` +
      `Start it with: cd ${appDir} && npx convex dev`,
  );
}

// --- run ---------------------------------------------------------------------

/** cmd.exe reads an unquoted `|` in an admin key as a pipe, so quote every argument. */
function quoteForShell(arg) {
  return `"${String(arg).replace(/"/g, '\\"')}"`;
}

function runConvex(args, options) {
  const { label, env = {}, secrets = [], capture = false, input } = options;

  let printable = ["convex", ...args].join(" ");
  for (const secret of secrets) {
    printable = printable.split(secret).join("***");
  }
  console.log(`\n[${label}] npx ${printable}`);

  // Only the source export gets a deploy key, and only from `env` below.
  const childEnv = { ...process.env };
  delete childEnv.CONVEX_DEPLOY_KEY;
  Object.assign(childEnv, env);

  const result = spawnSync(
    isWindows ? "npx.cmd" : "npx",
    isWindows ? ["convex", ...args].map(quoteForShell) : ["convex", ...args],
    {
      cwd: appDir,
      env: childEnv,
      stdio: [
        input === undefined ? "inherit" : "pipe",
        capture ? "pipe" : "inherit",
        "inherit",
      ],
      input,
      shell: isWindows,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (result.error) {
    fail(`[${label}] could not start npx: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`[${label}] failed; aborting.`);
  }
  return capture ? (result.stdout ?? "") : "";
}

const zipPath = join(appDir, "backups", `${appName}-${sourceName}.zip`);

console.log(`Syncing ${appName}`);
console.log(`  source: ${sourceName} (from the deploy key)`);
console.log(`  target: ${target.url} — ${target.name} (${target.from})`);
console.log(
  `  file storage: ${values["include-storage"] ? "included" : "skipped"}`,
);
console.log(`  env vars: ${values["include-env"] ? "copied" : "left alone"}`);
console.log(`  snapshot: ${zipPath}`);

mkdirSync(dirname(zipPath), { recursive: true });
rmSync(zipPath, { force: true });

const exportArgs = ["export", "--path", zipPath];
if (values["include-storage"]) {
  exportArgs.push("--include-file-storage");
}
runConvex(exportArgs, {
  label: `export ${sourceName}`,
  env: { CONVEX_DEPLOY_KEY: sourceKey },
  secrets: [sourceKey],
});

runConvex(
  [
    "import",
    "--url",
    target.url,
    "--admin-key",
    target.adminKey,
    "--replace-all",
    "--yes",
    zipPath,
  ],
  { label: `import into ${target.name}`, secrets: [target.adminKey] },
);

if (values["include-env"]) {
  // `env list` prints dotenv-formatted lines and `env set` reads that format back,
  // so this is a pipe. It goes over stdin so no value is written to disk or logged,
  // and `env set` drops the CLI-managed CONVEX_* names itself.
  const dump = runConvex(["env", "list"], {
    label: `env list ${sourceName}`,
    env: { CONVEX_DEPLOY_KEY: sourceKey },
    secrets: [sourceKey],
    capture: true,
  });
  const names = dump.split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z_][A-Za-z0-9_]*)=/.exec(line);
    return match === null ? [] : [match[1]];
  });
  if (names.length === 0) {
    console.log("\nSource has no environment variables; nothing to copy.");
  } else {
    runConvex(
      [
        "env",
        "set",
        "--force",
        "--url",
        target.url,
        "--admin-key",
        target.adminKey,
      ],
      {
        label: `env set on ${target.name}`,
        secrets: [target.adminKey],
        input: dump,
      },
    );
    console.log(`\nCopied ${names.length} env var(s): ${names.join(", ")}`);
    console.log(
      "These are the source deployment's secrets; they now live on this machine.",
    );
  }
}

if (values["keep-snapshot"]) {
  console.log(
    `\nSnapshot kept at ${zipPath} — it holds real data, do not commit or share it.`,
  );
} else {
  rmSync(zipPath, { force: true });
}

console.log(
  `\nDone. ${target.name} (${target.url}) now mirrors ${sourceName}.`,
);
