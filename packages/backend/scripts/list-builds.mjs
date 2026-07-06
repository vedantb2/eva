import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync(
  "node",
  [
    "node_modules/convex/bin/main.js",
    "run",
    "--inline-query",
    `const builds = await ctx.db.query('snapshotBuilds').withIndex('by_repo_snapshot', q => q.eq('repoSnapshotId', 'rh74g8w7mczaf7m7kg0vhnj1y181tyh2')).order('desc').take(3); return builds.map(b=>({_id:b._id,status:b.status,error:b.error?.slice(0,120)}));`,
  ],
  {
    cwd: backendDir,
    encoding: "utf8",
    env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" },
  },
);
console.log(result.stdout);
