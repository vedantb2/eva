import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_ID = process.argv[2];

function query(code) {
  const result = spawnSync(
    "node",
    ["node_modules/convex/bin/main.js", "run", "--inline-query", code],
    {
      cwd: backendDir,
      encoding: "utf8",
      env: { ...process.env, CONVEX_DEPLOYMENT: "dev:good-mule-506" },
    },
  );
  return JSON.parse(result.stdout);
}

if (!BUILD_ID) {
  const builds = query(
    `const builds = await ctx.db.query('snapshotBuilds').withIndex('by_repo_snapshot', q => q.eq('repoSnapshotId', 'rh74g8w7mczaf7m7kg0vhnj1y181tyh2')).order('desc').take(1); return builds[0] ? { _id: builds[0]._id, status: builds[0].status, error: builds[0].error } : null;`,
  );
  console.log(JSON.stringify(builds, null, 2));
  process.exit(0);
}

const data = query(
  `const b = await ctx.db.get('${BUILD_ID}'); const logs = b?.logs ?? ''; const web = await ctx.db.get('mh7fdbcrhbt6wbwqkdxr0xe4c182502a'); return { status: b?.status, error: b?.error, logLen: logs.length, web: { seeded: web?.seededSnapshotName, class: web?.seededSnapshotClass }, vmHotLines: logs.split('\\n').filter(l => l.includes('vm-hot') || l.includes('SEEDRUN') || l.includes('seeded build')).slice(-20), tail: logs.slice(-1200) };`,
);
console.log(JSON.stringify(data, null, 2));
