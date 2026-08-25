// Fails CI when a diff removes a Convex schema field, table, or union member
// without a migration that first drains the live rows still holding it.
//
// This exists because `git revert` is not safe on a Convex schema: reverting a
// commit that added `sessions.turnLifecycleVersion` removed the field from the
// schema while production rows still carried it, and the deploy had to be
// rescued with emergency migrations. The gate is a diff heuristic, not a type
// checker — it only asks "did a field name disappear from these two files?".
//
//   node scripts/check-schema-narrowing.mjs
//
// Base ref resolution:
//   SCHEMA_NARROWING_BASE   explicit override (the workflow sets this on push)
//   CI + GITHUB_BASE_REF    origin/<base branch> of the pull request
//   otherwise               origin/main
// The comparison point is always `git merge-base <base> HEAD`.
//
// Escape hatch: put `// schema-narrowing-ok: <migrationName>` on or next to the
// removal, and export a matching migration from convex/dataMigrations.ts. The
// gate then trusts that the rows were drained first.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The two files that define every stored field shape. */
export const WATCHED_FILES = [
  "packages/backend/convex/schema.ts",
  "packages/backend/convex/_validators/tableFields.ts",
];

const MIGRATIONS_FILE = "packages/backend/convex/dataMigrations.ts";
const MARKER = "schema-narrowing-ok:";

// A removed line only counts when it looks like a stored-shape definition.
// Comment lines never match: `\w` cannot start at `*`, `//`, or `/**`.
const DEFINITION_PATTERNS = [
  // `foo: v.optional(v.string()),`  /  `"foo.bar": v.string(),`
  {
    kind: "field",
    re: /^\s*(?:["']([\w.$-]+)["']|([A-Za-z_$][\w$]*))\s*:\s*v\./,
  },
  // `users: defineTable(userFields)`
  {
    kind: "table",
    re: /^\s*(?:["']([\w.$-]+)["']|([A-Za-z_$][\w$]*))\s*:\s*defineTable\(/,
  },
];

// `v.literal("running")` — one member of a stored union.
const LITERAL_RE = /v\.literal\(\s*["']([^"']+)["']\s*\)/g;

/**
 * Split a unified diff into `{ file, removed: [{ line, text }], kept: [text] }`.
 * `kept` is every added or context line, which is where a marker may sit.
 */
function parseDiff(diff) {
  /** @type {Map<string, { removed: { line: number, text: string }[], kept: string[] }>} */
  const byFile = new Map();
  let current = null;
  let oldLine = 0;

  for (const raw of diff.split("\n")) {
    const header = /^\+\+\+ b\/(.+)$/.exec(raw);
    if (header) {
      const file = header[1];
      if (!byFile.has(file)) byFile.set(file, { removed: [], kept: [] });
      current = byFile.get(file);
      continue;
    }
    if (raw.startsWith("--- ")) continue;
    if (raw.startsWith("diff --git")) {
      current = null;
      continue;
    }
    const hunk = /^@@ -(\d+)/.exec(raw);
    if (hunk) {
      oldLine = Number(hunk[1]);
      continue;
    }
    if (!current) continue;

    if (raw.startsWith("-")) {
      current.removed.push({ line: oldLine, text: raw.slice(1) });
      oldLine++;
    } else if (raw.startsWith("+")) {
      current.kept.push(raw.slice(1));
    } else if (raw.startsWith(" ")) {
      current.kept.push(raw.slice(1));
      oldLine++;
    }
  }
  return byFile;
}

/** Every name a removed line claims to define. */
function definedNames(text) {
  const names = [];
  for (const { kind, re } of DEFINITION_PATTERNS) {
    const match = re.exec(text);
    if (match) names.push({ kind, name: match[1] ?? match[2] });
  }
  for (const match of text.matchAll(LITERAL_RE)) {
    names.push({ kind: "union member", name: match[1] });
  }
  return names;
}

/** `export const foo = ` / `export async function foo(` in dataMigrations.ts. */
function exportsMigration(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  return new RegExp(
    `export\\s+(?:const|let|function|async\\s+function)\\s+${escaped}\\b`,
  ).test(source);
}

/**
 * Pure analysis: given the diff of the watched files, the current content of
 * those files, and the dataMigrations.ts source, decide whether the change
 * narrows the stored schema without cover.
 *
 * A removed name is only reported when it appears nowhere in `newContent` —
 * so moves between the two files, renames of the surrounding const, and
 * reordering never trip the gate.
 *
 * `migrationsSource` is searched as plain text, so the caller may concatenate
 * several revisions of dataMigrations.ts. It does: docs/eva-convex.md has the
 * migration deleted once it has run, which is often the same change that
 * removes the field, so the base revision has to count too.
 *
 * @param {{ diff: string, newContent: string, migrationsSource: string }} input
 */
export function analyzeSchemaNarrowing({ diff, newContent, migrationsSource }) {
  const byFile = parseDiff(diff);
  const watched = new Set(WATCHED_FILES);

  /** @type {{ file: string, line: number, kind: string, name: string }[]} */
  const removals = [];
  /** @type {string[]} */
  const markers = [];

  for (const [file, hunks] of byFile) {
    if (!watched.has(file)) continue;

    for (const line of hunks.kept) {
      const found = new RegExp(`${MARKER}\\s*([\\w$]+)`).exec(line);
      if (found) markers.push(found[1]);
    }

    const seen = new Set();
    for (const { line, text } of hunks.removed) {
      // A removal that carries its own marker documents itself.
      const inline = new RegExp(`${MARKER}\\s*([\\w$]+)`).exec(text);
      if (inline) markers.push(inline[1]);

      for (const { kind, name } of definedNames(text)) {
        if (newContent.includes(name)) continue;
        const key = `${kind}:${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        removals.push({ file, line, kind, name });
      }
    }
  }

  const uniqueMarkers = [...new Set(markers)];
  const missingMigrations = uniqueMarkers.filter(
    (name) => !exportsMigration(migrationsSource, name),
  );

  if (removals.length === 0) {
    return { ok: true, removals, markers: uniqueMarkers, missingMigrations };
  }
  if (uniqueMarkers.length === 0) {
    return {
      ok: false,
      reason: "unmarked",
      removals,
      markers: uniqueMarkers,
      missingMigrations,
    };
  }
  if (missingMigrations.length > 0) {
    return {
      ok: false,
      reason: "missing-migration",
      removals,
      markers: uniqueMarkers,
      missingMigrations,
    };
  }
  return { ok: true, removals, markers: uniqueMarkers, missingMigrations };
}

function git(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    // Own the failure messages; a missing ref is expected in some callers.
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function resolveBase() {
  const explicit = process.env.SCHEMA_NARROWING_BASE?.trim();
  if (explicit && !/^0+$/.test(explicit)) return explicit;
  if (process.env.CI) {
    const branch = process.env.GITHUB_BASE_REF?.trim();
    return `origin/${branch && branch.length > 0 ? branch : "main"}`;
  }
  return "origin/main";
}

function readOrEmpty(rel) {
  try {
    return readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    return "";
  }
}

function main() {
  const base = resolveBase();
  let mergeBase;
  try {
    mergeBase = git(["merge-base", base, "HEAD"]).trim();
  } catch {
    console.warn(
      `check-schema-narrowing: cannot resolve base "${base}" — skipping.\n` +
        "In CI, check out with fetch-depth: 0 so the base branch is available.",
    );
    return 0;
  }

  const diff = git([
    "diff",
    "--unified=0",
    mergeBase,
    "HEAD",
    "--",
    ...WATCHED_FILES,
  ]);

  // Both revisions: the migration that unblocks a removal is often deleted by
  // the same change, once it has been run.
  let baseMigrations = "";
  try {
    baseMigrations = git(["show", `${mergeBase}:${MIGRATIONS_FILE}`]);
  } catch {
    baseMigrations = "";
  }

  const result = analyzeSchemaNarrowing({
    diff,
    newContent: WATCHED_FILES.map(readOrEmpty).join("\n"),
    migrationsSource: `${readOrEmpty(MIGRATIONS_FILE)}\n${baseMigrations}`,
  });

  if (result.ok) {
    const covered = result.removals.length;
    console.log(
      covered === 0
        ? `check-schema-narrowing: OK — no schema narrowing against ${base}.`
        : `check-schema-narrowing: OK — ${covered} removal(s) covered by migration(s): ${result.markers.join(", ")}.`,
    );
    return 0;
  }

  console.error(
    `check-schema-narrowing: this change removes ${result.removals.length} stored schema definition(s):\n`,
  );
  for (const { file, line, kind, name } of result.removals) {
    console.error(`  ${file}:${line}  removed ${kind} "${name}"`);
  }

  if (result.reason === "missing-migration") {
    console.error(
      `\nA ${MARKER} marker names ${result.missingMigrations.map((n) => `"${n}"`).join(", ")}, ` +
        `but neither this revision nor the base of ${MIGRATIONS_FILE} exports it.` +
        "\nCheck the spelling against the exported migration name.",
    );
  }

  console.error(
    "\nLive rows may still hold these. Removing them from the schema before the" +
      "\ndata is drained fails the deploy and needs an emergency migration." +
      "\n" +
      "\nTo proceed:" +
      `\n  1. Add a migration to ${MIGRATIONS_FILE} that clears the field on every row.` +
      "\n  2. Deploy and run it (see docs/eva-convex.md > Migrations)." +
      `\n  3. Then remove the field, with \`// ${MARKER} <migrationName>\` on the change.` +
      "\n" +
      "\nIf this is a revert, revert the migration story too — do not hand-edit the schema.",
  );
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
