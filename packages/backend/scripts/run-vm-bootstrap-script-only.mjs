import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = JSON.stringify({
  repoId: "mh7ca667pjd7fjaqtw6n86vxex82jev6",
});

const result = spawnSync(
  "node",
  [
    "node_modules/convex/bin/main.js",
    "run",
    "snapshotActions:debugVmBootstrapScriptOnly",
    args,
  ],
  {
    cwd: backendDir,
    encoding: "utf8",
    env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" },
  },
);

console.log("stdout:", result.stdout);
if (result.stderr) console.error("stderr:", result.stderr);
process.exit(result.status ?? 1);
