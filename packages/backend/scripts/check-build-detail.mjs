import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_ID = process.argv[2] ?? "rn7c19amgcqzm9rj4644t83pkd8a1j13";

const result = spawnSync(
  "node",
  [
    "node_modules/convex/bin/main.js",
    "run",
    "--inline-query",
    `const b = await ctx.db.get('${BUILD_ID}'); const web = await ctx.db.get('mh7fdbcrhbt6wbwqkdxr0xe4c182502a'); return { status: b?.status, seededApps: b?.seededApps, workflowId: b?.workflowId, error: b?.error, web: { vmHot: web?.vmHotSeededSnapshots, seeded: web?.seededSnapshotName, class: web?.seededSnapshotClass } };`,
  ],
  {
    cwd: backendDir,
    encoding: "utf8",
    env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" },
  },
);
console.log(result.stdout);
if (result.stderr) console.error(result.stderr);
