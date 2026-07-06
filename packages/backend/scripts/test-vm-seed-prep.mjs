import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = JSON.stringify({
  repoId: "mh7fdbcrhbt6wbwqkdxr0xe4c182502a",
  imageSnapshot: "snapshot-mh796tpcm1h0a0amat46r27wms81gwz3-vm",
});

const result = spawnSync(
  "node",
  [
    "node_modules/convex/bin/main.js",
    "run",
    "snapshotActions:createSeedPrepSandbox",
    args,
  ],
  {
    cwd: backendDir,
    encoding: "utf8",
    env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" },
    maxBuffer: 10 * 1024 * 1024,
  },
);

console.log("status", result.status);
console.log("stdout", result.stdout);
if (result.stderr) console.error("stderr tail:", result.stderr.slice(-3000));
