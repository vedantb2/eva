import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(root, "..");

const args = JSON.stringify({
  repoId: "mh7ca667pjd7fjaqtw6n86vxex82jev6",
});

const result = spawnSync(
  "node",
  ["node_modules/convex/bin/main.js", "run", "snapshotActions:debugVmExecTest", args],
  { cwd: backendRoot, stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
