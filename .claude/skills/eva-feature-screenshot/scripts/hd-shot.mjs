// HD capture for eva feature shots.
//
// agent-browser's `screenshot` captures at CSS-pixel resolution and throws away
// devicePixelRatio, so its output is always 1280x720 no matter the DPR. This
// script drives a real Chrome through Playwright at deviceScaleFactor 2 and
// captures with scale:"device", so the SAME 1280-wide layout lands as a crisp
// 2560x1440 PNG. Layout is unchanged (clientWidth stays 1280); only the pixel
// density doubles.
//
// Usage:
//   node hd-shot.mjs --path /vvedantb/eva/web/sessions --slug sessions
//   node hd-shot.mjs --slug session-modes --recipe C:/path/recipe.mjs
//
// Flags:
//   --path <urlpath>   navigate here after sign-in (plain shots). Omit when a
//                      --recipe drives navigation itself.
//   --slug <name>      output → screenshots/<today>-<slug>.png
//   --recipe <file>    a .mjs exporting `export async function stage(page, ctx)`.
//                      The recipe owns everything: navigation, sidebar collapse,
//                      opening menus, typing. hd-shot only signs in, hides dev
//                      overlays, and captures. ctx = { BASE, hideOverlays,
//                      collapseSidebar, settle }.
//   --settle <ms>      pause after networkidle for a plain --path shot (def 3000).
//   --no-collapse      for a plain --path shot, leave the sidebar expanded
//                      (use when the sidebar itself is the feature).
//
// The playwright-core binary ships bundled with the global agent-browser install.
// Override the location with PW_CORE if agent-browser lives elsewhere.

const PW_CORE = (
  process.env.PW_CORE ||
  "C:/Users/vedan/AppData/Roaming/npm/node_modules/agent-browser/node_modules/playwright-core/index.js"
).replace(/\\/g, "/");
const pw = await import(`file:///${PW_CORE}`);
const { chromium } = pw.default;

const BASE = "http://localhost:5173";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}
function flag(name) {
  return process.argv.includes(name);
}

const path = arg("--path");
const slug = arg("--slug");
const recipePath = arg("--recipe");
const settleMs = Number(arg("--settle", "3000"));
const noCollapse = flag("--no-collapse");

if (!slug) {
  console.error("hd-shot: --slug is required");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const out = `C:/Vedant/Personal/GitHub/eva/screenshots/${today}-${slug}.png`;

// Dev overlays are three nodes mounted on <html> (not <body>): react-scan's
// toolbar (#react-scan-root), a bare html > canvas that draws component
// outlines (the one that actually wrecks a shot), and [data-agentation-root].
// All carry inline styles, so only inline display:none beats them.
async function hideOverlays(page) {
  await page.evaluate(() => {
    const kill = (el) => {
      if (el) el.style.setProperty("display", "none", "important");
    };
    kill(document.getElementById("react-scan-root"));
    document.documentElement
      .querySelectorAll(":scope > canvas")
      .forEach(kill);
    document.querySelectorAll("[data-agentation-root]").forEach(kill);
  });
}

async function collapseSidebar(page) {
  await page.evaluate(() => {
    const hide = document.querySelector('button[aria-label="Hide sidebar"]');
    if (hide instanceof HTMLElement) hide.click();
  });
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const page = await context.newPage();

// Auto sign-in as the agent user (?agent=true is a boolean; /?agent throws).
await page.goto(`${BASE}/?agent=true`, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

if (recipePath) {
  const recipeUrl = `file:///${recipePath.replace(/\\/g, "/")}`;
  const recipe = await import(recipeUrl);
  const ctx = {
    BASE,
    hideOverlays,
    collapseSidebar,
    settle: (ms) => page.waitForTimeout(ms),
  };
  await recipe.stage(page, ctx);
} else if (path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(settleMs);
  if (!noCollapse) await collapseSidebar(page);
}

// Re-hide overlays last: navigation/staging can remount them.
await hideOverlays(page);
await page.waitForTimeout(600);

const dpr = await page.evaluate(() => window.devicePixelRatio);
const cw = await page.evaluate(() => document.documentElement.clientWidth);
console.log(`dpr ${dpr} clientW ${cw}`);

await page.screenshot({ path: out, scale: "device" });
await browser.close();
console.log(`saved: ${out}`);
