import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  process.execPath,
  [
    join(pluginDir, "../../packages/backend/node_modules/esbuild/bin/esbuild"),
    join(pluginDir, "index.ts"),
    "--bundle",
    "--platform=node",
    "--format=esm",
    "--packages=external",
    `--outfile=${join(pluginDir, "index.mjs")}`,
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
