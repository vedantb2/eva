import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" };
const REPO_ID = "mh7ca667pjd7fjaqtw6n86vxex82jev6";
const REPO_SNAPSHOT_ID = "rh74g8w7mczaf7m7kg0vhnj1y181tyh2";
const SNAPSHOT_NAME = "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm-eu16-test";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function convexRun(functionName, args) {
  const result = spawnSync(
    "node",
    ["node_modules/convex/bin/main.js", "run", functionName, JSON.stringify(args)],
    { cwd: backendDir, encoding: "utf8", env, maxBuffer: 10 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    console.error(result.stderr?.slice(-3000));
    throw new Error(`convex run ${functionName} failed`);
  }
  return JSON.parse(result.stdout);
}

async function main() {
  console.log("=== Daytona regions ===");
  const regions = convexRun("snapshotActions:debugListDaytonaRegions", {
    repoId: REPO_ID,
  });
  console.log("shared:", regions.sharedStatus, regions.sharedBody.slice(0, 2000));
  console.log("org:", regions.orgStatus, regions.orgBody.slice(0, 2000));

  console.log("\n=== Kick off linux-vm snapshot: region=eu, memory=16 ===");
  const kickoff = convexRun("snapshotActions:debugKickOffVmSnapshot", {
    repoId: REPO_ID,
    repoSnapshotId: REPO_SNAPSHOT_ID,
    snapshotName: SNAPSHOT_NAME,
    regionId: "eu",
    memory: 16,
  });
  console.log(JSON.stringify(kickoff, null, 2));

  if (kickoff.httpStatus < 200 || kickoff.httpStatus >= 300) {
    process.exit(1);
  }

  console.log("\n=== Poll snapshot state (default EU client) ===");
  let finalState = "pending";
  for (let i = 0; i < 20; i += 1) {
    await sleep(15_000);
    const state = convexRun("snapshotActions:inspectDaytonaSnapshot", {
      repoId: REPO_ID,
      snapshotName: SNAPSHOT_NAME,
    });
    finalState = state.sdkState ?? "pending";
    console.log(
      `poll ${i + 1}: sdk=${finalState} http=${state.listStatus} body=${state.listBody.slice(0, 200)}`,
    );
    if (finalState === "active" || finalState === "error") break;
  }

  if (finalState !== "active") {
    console.log("Snapshot did not become active — skipping sandbox exec test");
    process.exit(1);
  }

  console.log("\n=== Toolbox exec: boot VM snapshot in eu ===");
  const execTest = convexRun("snapshotActions:debugVmExecTest", {
    repoId: REPO_ID,
    region: "eu",
    snapshotName: SNAPSHOT_NAME,
  });
  console.log(JSON.stringify(execTest, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
