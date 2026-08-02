/**
 * Authenticated Lighthouse pass for local Eva.
 * Logs in via /?agent, then audits key routes.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "perf-audit");
const BASE = process.env.EVA_BASE || "http://localhost:5173";

const ROUTES = [
  { id: "home", path: "/home" },
  { id: "quick-tasks", path: "/vvedantb/eva/web/quick-tasks" },
  { id: "projects", path: "/vvedantb/eva/web/projects" },
  { id: "sessions", path: "/vvedantb/eva/web/sessions" },
];

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(url, pred, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (pred(res)) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const port = await freePort();
  const userDataDir = path.join(OUT, "chrome-profile");
  fs.mkdirSync(userDataDir, { recursive: true });

  const chromeCandidates = [
    process.env.CHROME_PATH,
    "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
    "C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
    "C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe",
  ].filter(Boolean);

  let chromePath = null;
  for (const c of chromeCandidates) {
    if (fs.existsSync(c)) {
      chromePath = c;
      break;
    }
  }
  if (!chromePath) throw new Error("Chrome/Edge not found");

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `${BASE}/?agent`,
    ],
    { stdio: "ignore" },
  );

  try {
    await waitFor(`http://127.0.0.1:${port}/json/version`, (r) => r.ok);

    // Wait until an authenticated tab lands on /home (or any app shell).
    const loginDeadline = Date.now() + 90000;
    let loggedIn = false;
    while (Date.now() < loginDeadline) {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      loggedIn = tabs.some(
        (t) =>
          typeof t.url === "string" &&
          (t.url.includes("/home") ||
            t.url.includes("/vvedantb/") ||
            t.url.includes("/sessions")),
      );
      if (loggedIn) break;
      await sleep(1000);
    }
    if (!loggedIn) {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      console.error("Login did not complete. Tabs:", tabs.map((t) => t.url));
      throw new Error("agent login failed");
    }

    const lighthouse = (await import("lighthouse")).default;
    const summary = [];

    for (const route of ROUTES) {
      const url = `${BASE}${route.path}`;
      console.error(`Auditing ${route.id}: ${url}`);
      const result = await lighthouse(
        url,
        {
          port,
          output: "json",
          logLevel: "error",
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          formFactor: "desktop",
          screenEmulation: { disabled: true },
          throttlingMethod: "provided",
          disableStorageReset: true,
        },
        {
          extends: "lighthouse:default",
          settings: {
            formFactor: "desktop",
            screenEmulation: { disabled: true },
            throttlingMethod: "provided",
          },
        },
      );

      const outPath = path.join(OUT, `${route.id}.lighthouse.json`);
      fs.writeFileSync(outPath, result.report);

      const cats = result.lhr.categories;
      const audits = result.lhr.audits;
      const row = {
        id: route.id,
        url,
        scores: {
          performance: Math.round((cats.performance?.score ?? 0) * 100),
          accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
          bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
          seo: Math.round((cats.seo?.score ?? 0) * 100),
        },
        metrics: {
          FCP_ms: Math.round(audits["first-contentful-paint"]?.numericValue ?? 0),
          LCP_ms: Math.round(audits["largest-contentful-paint"]?.numericValue ?? 0),
          TBT_ms: Math.round(audits["total-blocking-time"]?.numericValue ?? 0),
          CLS: Number((audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
          SI_ms: Math.round(audits["speed-index"]?.numericValue ?? 0),
        },
        topOpportunities: Object.values(audits)
          .filter((a) => a.details?.type === "opportunity" && (a.numericValue ?? 0) > 0)
          .sort((a, b) => (b.numericValue ?? 0) - (a.numericValue ?? 0))
          .slice(0, 5)
          .map((a) => ({
            id: a.id,
            title: a.title,
            ms: Math.round(a.numericValue ?? 0),
          })),
      };
      summary.push(row);
      console.error(JSON.stringify(row.scores), JSON.stringify(row.metrics));
    }

    const summaryPath = path.join(OUT, "summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify({ base: BASE, at: new Date().toISOString(), summary }, null, 2));
    console.log(JSON.stringify({ summaryPath, summary }, null, 2));
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
