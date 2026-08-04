// Replaces the cloud dev deployment's data with a fresh prod snapshot.
//
// Two steps, both through the Convex CLI so authentication comes from the
// logged-in `convex login` session (no deploy keys anywhere in the repo):
//   1. `convex export --prod` writes a timestamped ZIP into backups/, which
//      doubles as a real prod backup (documents + file storage).
//   2. `convex import --replace-all` mirrors that ZIP into the dev deployment.
//
// Snapshot import preserves document `_id`s and storage IDs, and does not touch
// the target deployment's environment variables.
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// The only deployment this script is ever allowed to write to. Hardcoded rather
// than read from .env.local so a stray local override cannot redirect the
// destructive --replace-all import.
const TARGET_DEPLOYMENT = "dev:good-mule-506";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");
const backupsDir = join(backendRoot, "backups");

if (!TARGET_DEPLOYMENT.startsWith("dev:")) {
  console.error(
    `Refusing to run: TARGET_DEPLOYMENT (${TARGET_DEPLOYMENT}) is not a dev deployment.`,
  );
  process.exit(1);
}
const targetName = TARGET_DEPLOYMENT.slice("dev:".length);

/** Runs a `convex` subcommand, streaming its output, and exits on failure. */
function convex(args, label) {
  console.log(`\n[${label}] npx convex ${args.join(" ")}`);
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["convex", ...args],
    {
      cwd: backendRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  if (result.status !== 0) {
    console.error(`\n[${label}] failed; aborting.`);
    process.exit(result.status ?? 1);
  }
}

// Colons and dots are illegal in Windows filenames, so flatten the ISO stamp.
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const zipPath = join(backupsDir, `prod-${stamp}.zip`);

mkdirSync(backupsDir, { recursive: true });

convex(
  ["export", "--prod", "--include-file-storage", "--path", zipPath],
  "export prod",
);

convex(
  ["import", "--deployment", targetName, "--replace-all", "--yes", zipPath],
  `import into ${TARGET_DEPLOYMENT}`,
);

console.log(`\nDone. ${TARGET_DEPLOYMENT} now mirrors prod.`);
console.log(`Backup kept at ${zipPath}`);
