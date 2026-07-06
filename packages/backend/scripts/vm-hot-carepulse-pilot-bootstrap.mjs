import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const deployment = process.env.CONVEX_DEPLOYMENT ?? "dev:good-mule-506";

const CAREPULSE_WEB_REPO_ID = "mh7fdbcrhbt6wbwqkdxr0xe4c182502a";
const EVA_WEB_REPO_ID = "mh7ccabpz5w729gy9e3vpkachx825916";
const CAREPULSE_REPO_SNAPSHOT_ID = "rh74g8w7mczaf7m7kg0vhnj1y181tyh2";

function convexRun(functionName, args) {
  const json = JSON.stringify(args);
  const result = spawnSync(
    "node",
    ["node_modules/convex/bin/main.js", "run", functionName, json],
    { cwd: backendDir, encoding: "utf8", env: { ...process.env, CONVEX_DEPLOYMENT: deployment } },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    throw new Error(`convex run ${functionName} failed`);
  }
  return result.stdout.trim();
}

function convexInlineQuery(code) {
  const result = spawnSync(
    "node",
    ["node_modules/convex/bin/main.js", "run", "--inline-query", code],
    { cwd: backendDir, encoding: "utf8", env: { ...process.env, CONVEX_DEPLOYMENT: deployment } },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    throw new Error("inline query failed");
  }
  return JSON.parse(result.stdout);
}

// 1. Sync startup/background/stop from prod
console.log("Fetching prod carepulse web commands...");
const prodResult = spawnSync(
  "node",
  [
    "node_modules/convex/bin/main.js",
    "run",
    "--prod",
    "--inline-query",
    `const r = await ctx.db.get('${CAREPULSE_WEB_REPO_ID}'); return { startupCommands: r?.startupCommands ?? [], backgroundCommands: r?.backgroundCommands ?? [], stopCommands: r?.stopCommands ?? [] };`,
  ],
  { cwd: backendDir, encoding: "utf8" },
);
if (prodResult.status !== 0) throw new Error("prod query failed");
const prodCommands = JSON.parse(prodResult.stdout);
console.log(
  `Prod commands: startup=${prodCommands.startupCommands.length}, bg=${prodCommands.backgroundCommands.length}, stop=${prodCommands.stopCommands.length}`,
);

console.log("Syncing commands to dev...");
convexRun("githubRepos:setRepoCommandsInternal", {
  repoId: CAREPULSE_WEB_REPO_ID,
  startupCommands: prodCommands.startupCommands,
  backgroundCommands: prodCommands.backgroundCommands,
  stopCommands: prodCommands.stopCommands,
});

// 2. Pilot flags
console.log("Enabling VM hot on carepulse apps/web...");
convexRun("repoSnapshots:enableVmHotSeededSnapshotsPilot", {
  repoId: CAREPULSE_WEB_REPO_ID,
  enabled: true,
});
console.log("Disabling VM hot on eva apps/web...");
convexRun("repoSnapshots:enableVmHotSeededSnapshotsPilot", {
  repoId: EVA_WEB_REPO_ID,
  enabled: false,
});

// 3. Trigger force rebuild
console.log("Triggering forceImageRebuild for carepulse-ts...");
convexRun("repoSnapshots:triggerScheduledBuild", {
  repoSnapshotId: CAREPULSE_REPO_SNAPSHOT_ID,
  forceImageRebuild: true,
  disableRetries: true,
});

const builds = convexInlineQuery(
  `const builds = await ctx.db.query('snapshotBuilds').withIndex('by_repo_snapshot', q => q.eq('repoSnapshotId', '${CAREPULSE_REPO_SNAPSHOT_ID}')).order('desc').take(1); return builds[0] ? { _id: builds[0]._id, status: builds[0].status } : null;`,
);
console.log("Latest build:", builds);
writeFileSync(
  join(backendDir, ".vm-hot-pilot-build.json"),
  JSON.stringify({ buildId: builds?._id, repoId: CAREPULSE_WEB_REPO_ID, startedAt: Date.now() }, null, 2),
);
