import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" };
const REPO_ID = "mh7ca667pjd7fjaqtw6n86vxex82jev6";
const REPO_SNAPSHOT_ID = "rh74g8w7mczaf7m7kg0vhnj1y181tyh2";

function convexRun(functionName, args) {
  const result = spawnSync(
    "node",
    ["node_modules/convex/bin/main.js", "run", functionName, JSON.stringify(args)],
    { cwd: backendDir, encoding: "utf8", env, maxBuffer: 10 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    console.error(result.stderr?.slice(-2000));
    throw new Error(`convex run ${functionName} failed`);
  }
  return JSON.parse(result.stdout);
}

const cases = [
  { label: "experimental + 16GiB", regionId: "experimental", memory: 16, name: "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm-exp16-test" },
  { label: "us + 16GiB", regionId: "us", memory: 16, name: "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm-us16-test" },
  { label: "eu + 12GiB (control)", regionId: "eu", memory: 12, name: "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm-eu12-test" },
];

for (const testCase of cases) {
  console.log(`\n=== ${testCase.label} ===`);
  const kickoff = convexRun("snapshotActions:debugKickOffVmSnapshot", {
    repoId: REPO_ID,
    repoSnapshotId: REPO_SNAPSHOT_ID,
    snapshotName: testCase.name,
    regionId: testCase.regionId,
    memory: testCase.memory,
  });
  console.log(JSON.stringify(kickoff, null, 2));
}
