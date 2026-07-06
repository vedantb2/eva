import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = JSON.stringify({
  buildId: "rn724ah5b2akh3em1mc6gqzymn8a12fr",
  repoId: "mh7ca667pjd7fjaqtw6n86vxex82jev6",
  thinSnapshotName: "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm-thin",
  finalSnapshotName: "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm",
});

const result = spawnSync(
  "node",
  [
    "node_modules/convex/bin/main.js",
    "run",
    "snapshotActions:bootstrapVmBaseTooling",
    args,
  ],
  {
    cwd: backendDir,
    stdio: "inherit",
    env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" },
  },
);

process.exit(result.status ?? 1);
