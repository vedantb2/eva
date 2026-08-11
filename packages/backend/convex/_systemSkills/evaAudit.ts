import type { SystemSkillHydration } from "./registry";

const DEFAULT_CATEGORIES = [
  {
    name: "Correctness",
    description:
      "Does the change do what it claims? Look for logic errors, unhandled cases, and broken assumptions.",
  },
  {
    name: "Security",
    description:
      "Authorisation gaps, injection, secrets in source, unvalidated input crossing a trust boundary.",
  },
  {
    name: "Performance",
    description:
      "Needless work in hot paths, unbounded queries or loops, missing indexes, obvious N+1 patterns.",
  },
  {
    name: "Code quality",
    description:
      "Duplication, dead code, unclear naming, and drift from the conventions already used in this repo.",
  },
];

/**
 * Content served by the `get_skill` MCP tool for `eva-audit`. Reviews the branch
 * against `DEFAULT_CATEGORIES` and reports in chat as markdown.
 */
export function buildEvaAuditContent(hydration: SystemSkillHydration): string {
  const categoryList = DEFAULT_CATEGORIES.map(
    (category, index) => `${index + 1}. **${category.name}** — ${category.description}`,
  ).join("\n");
  const rootDirectoryLine = hydration.rootDirectory
    ? `\n- App directory: \`/tmp/repo/${hydration.rootDirectory}\``
    : "";

  return `# eva-audit

Audit the work on this branch and report the findings in chat. Read-only — do not fix anything unless the user asks afterwards.

## This repo
- Repo: ${hydration.owner}/${hydration.name}
- Base branch: \`${hydration.baseBranch}\`${rootDirectoryLine}

## Step 1 — Scope the diff
1. \`cd /tmp/repo && git fetch origin ${hydration.baseBranch}\`
2. \`git diff --stat origin/${hydration.baseBranch}...HEAD\`
3. \`git diff origin/${hydration.baseBranch}...HEAD\` for the hunks.

Audit ONLY what this branch changed. Read the surrounding files for context — a hunk that looks fine in isolation can still break its caller — but do not report pre-existing issues the branch did not touch.

## Step 2 — Review each category
${categoryList}

For each category, decide pass or fail and list the findings that justify it. Every finding needs a file reference (\`path/to/file.ts:42\`), one sentence of explanation, and a severity:

- **critical** — security holes, data loss, broken core functionality
- **high** — significant bugs, performance regressions, accessibility violations
- **medium** — code quality problems, missing tests, minor bugs
- **low** — style, small improvements, nice-to-haves

Verify before you report. Read the code path rather than pattern-matching on the diff, and drop anything you cannot substantiate. A short list of real findings beats a long list of guesses.

## Step 3 — Report in chat
Reply with markdown, not JSON, and do not write a report file:

\`\`\`
## Audit — <n> findings

### <Category> — pass | fail
- **[severity]** \`file.ts:12\` — one-sentence finding.

## Summary
One or two sentences on whether this branch is safe to ship.
\`\`\`

Skip categories with nothing to report rather than padding them. End by offering to fix the findings — do not start fixing on your own.

## Rules
- Do not edit source files, commit, or push.
- Do not run the full build; \`npx tsc --noEmit\` is fine if a type question decides a finding.
- Prefix shell commands with timeouts, for example \`timeout 60 git diff\`.
- Never use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`.
`;
}
