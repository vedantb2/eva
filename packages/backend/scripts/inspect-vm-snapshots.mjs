import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = [
  "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm",
  "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3",
];

for (const snapshotName of names) {
  const args = JSON.stringify({
    repoId: "mh7ca667pjd7fjaqtw6n86vxex82jev6",
    snapshotName,
  });
  const result = spawnSync(
    "node",
    ["node_modules/convex/bin/main.js", "run", "snapshotActions:inspectDaytonaSnapshot", args],
    { cwd: backendDir, encoding: "utf8", env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" } },
  );
  console.log(`\n=== ${snapshotName} ===`);
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
}
