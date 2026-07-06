import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_ID = "rn724ah5b2akh3em1mc6gqzymn8a12fr";

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

const data = query(
  `const b = await ctx.db.get('${BUILD_ID}'); const logs = b?.logs ?? ''; const lines = logs.split('\\n'); return { status: b?.status, error: b?.error, tail: lines.slice(-15), markers: lines.filter(l => l.includes('bcdef07a') || l.includes('Bootstrap script finished') || l.includes('Cold capture') || l.includes('bootstrap failed')).slice(-10) };`,
);
console.log(JSON.stringify(data, null, 2));
