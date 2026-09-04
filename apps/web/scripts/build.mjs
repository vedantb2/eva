#!/usr/bin/env node
/**
 * Production build script for Eva web.
 *
 * On Vercel production (VERCEL_ENV=production), deploys Convex backend BEFORE
 * building the frontend so the web deploy never goes live against an old backend.
 *
 * Prerequisites for Vercel Production environment:
 * - CONVEX_DEPLOY_KEY: deploy key for sensible-woodpecker-357 (Eva production)
 *
 * Preview/staging builds skip Convex deploy — they use the existing production
 * backend or a preview Convex deployment configured separately.
 */
import { execSync } from "node:child_process";

const isProduction = process.env.VERCEL_ENV === "production";
const hasDeployKey = Boolean(process.env.CONVEX_DEPLOY_KEY);

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", ...options });
}

if (isProduction) {
  console.log("[build] Vercel production build detected");

  if (hasDeployKey) {
    console.log("[build] Deploying Convex backend before web build...");
    run("pnpm run deploy", { cwd: "../../packages/backend" });
    console.log("[build] Convex deploy complete");
  } else {
    console.error(
      "[build] ERROR: CONVEX_DEPLOY_KEY not set in Vercel Production environment.\n" +
        "        Add the deploy key for sensible-woodpecker-357 to Vercel Production env vars.\n" +
        "        Skipping Convex deploy — this build may go live against an old backend!"
    );
  }
} else {
  console.log(
    `[build] Non-production build (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}) — skipping Convex deploy`
  );
}

console.log("[build] Building web frontend...");
run("vite build");
console.log("[build] Done");
