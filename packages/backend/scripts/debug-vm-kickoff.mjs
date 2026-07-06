import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = JSON.stringify({
  repoId: "mh7ca667pjd7fjaqtw6n86vxex82jev6",
  repoSnapshotId: "rh74g8w7mczaf7m7kg0vhnj1y181tyh2",
  snapshotName: "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm-test",
});

const result = spawnSync(
  "node",
  ["node_modules/convex/bin/main.js", "run", "snapshotActions:debugKickOffVmSnapshot", args],
  { cwd: backendDir, encoding: "utf8", env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" } },
);
console.log(result.stdout);
if (result.stderr) console.error(result.stderr);
process.exit(result.status ?? 0);
