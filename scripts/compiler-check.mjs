// Runs oxc-transform-react (the exact React Compiler the build runs) over
// apps/web/src and fails when a file bails out of compilation for a reason not
// recorded in the baseline. @vitejs/plugin-react surfaces each bailout as a
// build warning, but a 700-chunk build scrolls them past unnoticed and nothing
// fails — so this stays the gate that actually stops a regression.
//
//   node scripts/compiler-check.mjs             check against the baseline
//   node scripts/compiler-check.mjs --update    rewrite the baseline from HEAD
//
// The baseline (scripts/compiler-check-baseline.json) keys on "file :: reason"
// rather than line numbers so unrelated edits do not churn it. Entries that no
// longer reproduce are reported so the baseline can be shrunk; they never fail
// the check. The try/catch family of bailouts is additionally linted live by
// the oxlint no-value-block-in-try rule — this script is the backstop that
// catches every other reason (refs, purity, incompatible libraries, ...).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps", "web");
const BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "compiler-check-baseline.json",
);
const UPDATE = process.argv.includes("--update");

// Resolve the compiler through apps/web so we test what the build runs.
const req = createRequire(path.join(WEB, "package.json"));
const { transformSync } = await import(req.resolve("oxc-transform-react"));

// Mirrors @vitejs/plugin-react: files without a component-shaped identifier are
// skipped by the plugin, so compiling them here would report phantom bailouts.
const CODE_FILTER = /forwardRef|memo|\b(?:[A-Z]|use[A-Z0-9])/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

// Byte offsets come back on the diagnostic labels; the report wants line numbers.
function lineAt(code, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < code.length; i++) {
    if (code[i] === "\n") line++;
  }
  return line;
}

// key: "relpath :: reason"  ->  [line, line, ...] for display only
const found = new Map();

for (const file of walk(path.join(WEB, "src"))) {
  const code = readFileSync(file, "utf8");
  if (code.includes('"use no memo"')) continue; // deliberate opt-out
  if (!CODE_FILTER.test(code)) continue;
  const rel = path.relative(ROOT, file).split(path.sep).join("/");

  const result = transformSync(file, code, {
    reactCompiler: {},
    jsx: { runtime: "automatic" },
    sourcemap: false,
  });

  for (const error of result.errors ?? []) {
    const key = `${rel} :: ${error.message}`;
    const lines = found.get(key) ?? [];
    for (const label of error.labels ?? [])
      lines.push(lineAt(code, label.start));
    found.set(
      key,
      [...new Set(lines)].sort((a, b) => a - b),
    );
  }
}

const keys = [...found.keys()].sort();

if (UPDATE) {
  writeFileSync(BASELINE_PATH, JSON.stringify(keys, null, 2) + "\n");
  console.log(`compiler-check: baseline updated (${keys.length} entries).`);
  process.exit(0);
}

let baseline = [];
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
} catch {
  console.error(
    "compiler-check: no baseline found. Run `node scripts/compiler-check.mjs --update` first.",
  );
  process.exit(1);
}

const baselineSet = new Set(baseline);
const fresh = keys.filter((k) => !baselineSet.has(k));
const fixed = baseline.filter((k) => !found.has(k));

if (fixed.length > 0) {
  console.log(
    `compiler-check: ${fixed.length} baseline entr${fixed.length === 1 ? "y" : "ies"} no longer reproduce (run --update to shrink the baseline):`,
  );
  for (const k of fixed) console.log(`  - ${k}`);
}

if (fresh.length === 0) {
  console.log(
    `compiler-check: OK — ${keys.length} known bailout${keys.length === 1 ? "" : "s"}, none new.`,
  );
  process.exit(0);
}

console.error(
  `compiler-check: ${fresh.length} NEW React Compiler bailout${fresh.length === 1 ? "" : "s"} (whole file loses memoization):`,
);
for (const key of fresh) {
  const lines = found.get(key);
  console.error(
    `  ${key}${lines.length ? `  (line ${lines.join(", ")})` : ""}`,
  );
}
console.error(
  '\nFix the construct (see CLAUDE.md), add "use no memo" if the file must opt out,\nor run `node scripts/compiler-check.mjs --update` to accept it into the baseline.',
);
process.exit(1);
