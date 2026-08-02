// Scans apps/web/src and packages/ui/src for design-system drift — the call-site
// habits that regex can see and the type checker cannot, such as hand-rolled
// font sizes where a token exists, or a border stacked on an elevated surface.
//
//   node scripts/design-check.mjs             check against the baseline
//   node scripts/design-check.mjs --update    rewrite the baseline from HEAD
//
// Deliberately separate from compiler-check.mjs. That gate answers "did this
// file lose memoization"; this one answers "does this file follow the design
// system". Keeping them apart keeps the two signals readable when one fails.
//
// The baseline (scripts/design-check-baseline.json) keys on "file :: rule"
// rather than line numbers, so unrelated edits do not churn it and a file with
// twelve stray `text-[11px]` counts once. That makes the check a ratchet: new
// violations fail, the several hundred existing ones burn down over time.
// Entries that no longer reproduce are reported so the baseline can shrink;
// they never fail the check.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = path.join(ROOT, "scripts", "design-check-baseline.json");
const UPDATE = process.argv.includes("--update");

const SCAN_DIRS = [
  path.join(ROOT, "apps", "web", "src"),
  path.join(ROOT, "packages", "ui", "src"),
];

/**
 * Rules matched against the whole file. `why` is printed on failure, so it has
 * to say what to do instead — a rule name alone sends the reader to this file.
 */
const FILE_RULES = [
  {
    id: "arbitrary-font-size",
    // Tailwind ships nothing below `xs`; `text-3xs` and `text-2xs` now cover it.
    re: /\btext-\[[\d.]+(?:px|rem)\]/g,
    why: "use a fontSize token (text-3xs, text-2xs, text-xs, text-sm) — see apps/web/tailwind.config.js",
  },
  {
    id: "arbitrary-muted-alpha",
    re: /\btext-muted-foreground\/\d+/g,
    why: "use text-subtle-foreground for the tier below muted, or text-muted-foreground at full strength",
  },
  {
    id: "arbitrary-hover-muted",
    re: /\bhover:bg-muted\/\d+/g,
    why: "use hover:bg-muted — the six competing alphas were indistinguishable",
  },
  {
    id: "icon-size-prop",
    // `button.tsx` forces [&_svg]:size-4 on its children, so a size prop inside
    // a Button is silently overridden. Classes make that predictable.
    re: /<Icon[A-Z][A-Za-z0-9]*\b[^>]*?\bsize=\{\d+\}/g,
    why: "size the icon with a class (size-3.5, size-4) rather than a size prop",
  },
  {
    id: "query-empty-fallback",
    // Collapses Convex's loading sentinel (undefined) into a genuine empty
    // result, so the designed empty state flashes mid-fetch.
    re: /=\s*useQuery\([\s\S]{0,400}?\)\s*\?\?\s*\[\]/g,
    why: "keep undefined distinct from [] — render a skeleton while the query is loading",
  },
  {
    id: "transition-all",
    re: /\btransition-all\b/g,
    why: "name the properties that animate (transition-colors, transition-[transform,opacity])",
  },
  {
    id: "tracking-literal",
    re: /\btracking-\[-0\.02em\]/g,
    why: "use tracking-heading",
  },
];

/**
 * Rules that only make sense within one class string, because they are about
 * two utilities landing on the same element. Applied to each quoted string and
 * template-literal chunk rather than the whole file, so a border on line 10 and
 * a shadow on line 90 are not read as one mistake.
 */
const STRING_RULES = [
  {
    id: "outline-none-without-ring",
    test: (s) =>
      /\bfocus(?:-visible)?:outline-none\b/.test(s) && !/\bring-/.test(s),
    why: "removing the outline without a replacement ring leaves the control with no visible focus state",
  },
  {
    id: "hand-rolled-surface",
    test: (s) =>
      /\bbg-card\b/.test(s) &&
      /\brounded-(?:surface|lg|xl|md)\b/.test(s) &&
      /(?:^|\s)p-\d/.test(s),
    why: "use <Surface> rather than re-typing the card recipe",
  },
];

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

/** 1-indexed line number of a character offset. */
function lineAt(code, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (code[i] === "\n") line += 1;
  return line;
}

/**
 * Every string that could hold class names: double- and single-quoted literals
 * plus the static chunks of template literals. Interpolations are excluded on
 * purpose — a `${}` boundary usually separates mutually exclusive branches, and
 * treating the two sides as one string invents conflicts that cannot both apply.
 */
function classStrings(code) {
  const out = [];
  for (const m of code.matchAll(/"([^"\n]*)"|'([^'\n]*)'/g)) {
    out.push([m[1] ?? m[2], m.index]);
  }
  for (const m of code.matchAll(/`([^`]*)`/g)) {
    let offset = m.index + 1;
    for (const chunk of m[1].split(/\$\{[^}]*\}/g)) {
      out.push([chunk, offset]);
      offset += chunk.length;
    }
  }
  return out;
}

// key: "relpath :: rule" -> { lines, why }
const found = new Map();

function record(rel, rule, line, why) {
  const key = `${rel} :: ${rule}`;
  const existing = found.get(key);
  if (existing) {
    existing.lines.add(line);
    return;
  }
  found.set(key, { lines: new Set([line]), why });
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const code = readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file).split(path.sep).join("/");

    for (const rule of FILE_RULES) {
      for (const m of code.matchAll(rule.re)) {
        record(rel, rule.id, lineAt(code, m.index), rule.why);
      }
    }

    for (const [text, index] of classStrings(code)) {
      // A class string always has a utility in it; this skips prose and paths
      // cheaply, which matters because every string in the file is tested.
      if (!text.includes("-")) continue;
      for (const rule of STRING_RULES) {
        if (rule.test(text)) record(rel, rule.id, lineAt(code, index), rule.why);
      }
    }
  }
}

const keys = [...found.keys()].sort();

if (UPDATE) {
  writeFileSync(BASELINE_PATH, JSON.stringify(keys, null, 2) + "\n");
  console.log(`design-check: baseline updated (${keys.length} entries).`);
  process.exit(0);
}

let baseline = [];
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
} catch {
  console.error(
    "design-check: no baseline found. Run `node scripts/design-check.mjs --update` first.",
  );
  process.exit(1);
}

const baselineSet = new Set(baseline);
const fresh = keys.filter((k) => !baselineSet.has(k));
const fixed = baseline.filter((k) => !found.has(k));

if (fixed.length > 0) {
  console.log(
    `design-check: ${fixed.length} baseline entr${fixed.length === 1 ? "y" : "ies"} no longer reproduce (run --update to shrink the baseline):`,
  );
  for (const k of fixed) console.log(`  - ${k}`);
}

if (fresh.length === 0) {
  console.log(
    `design-check: OK — ${keys.length} known violation${keys.length === 1 ? "" : "s"}, none new.`,
  );
  process.exit(0);
}

console.error(
  `design-check: ${fresh.length} NEW design-system violation${fresh.length === 1 ? "" : "s"}:`,
);
for (const key of fresh) {
  const { lines, why } = found.get(key);
  const at = [...lines].sort((a, b) => a - b).join(", ");
  console.error(`  ${key}  (line ${at})`);
  console.error(`      ${why}`);
}
console.error(
  "\nFix the call site, or run `node scripts/design-check.mjs --update` to accept it\ninto the baseline (do that only when the rule genuinely does not apply).",
);
process.exit(1);
