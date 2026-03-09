import type { Id } from "../_generated/dataModel";
import { buildRootDirectoryInstruction } from "../prompts";
import { extractFailuresFromJson } from "./auditParser";

export const WORKSPACE_DIR = "/workspace/repo";

export function buildWorkflowRunNotificationMessage(params: {
  success: boolean;
  projectId: Id<"projects"> | undefined;
  error: string | null;
  prUrl: string | null;
}): string {
  const scopeLabel = params.projectId ? "project task" : "quick task";
  if (params.success) {
    if (params.prUrl) {
      return `Run succeeded for this ${scopeLabel}. Pull request: ${params.prUrl}`;
    }
    return `Run succeeded for this ${scopeLabel}.`;
  }
  if (params.error) {
    const trimmedError = params.error.trim();
    const clippedError =
      trimmedError.length > 200
        ? `${trimmedError.slice(0, 197)}...`
        : trimmedError;
    return `Run failed for this ${scopeLabel}. ${clippedError}`;
  }
  return `Run failed for this ${scopeLabel}.`;
}

export function buildImplementationPrompt(
  task: { title: string; description?: string; taskNumber?: number },
  subtasks: Array<{ title: string }>,
  branchName: string,
  isQuickTask: boolean,
  rootDirectory: string,
  changeRequests?: string[],
): string {
  const subtasksList =
    subtasks.length > 0
      ? `\n## Subtasks:\n${subtasks.map((s, i) => `${i}. ${s.title}`).join("\n")}`
      : "";

  const commitScope = isQuickTask
    ? "feat"
    : `feat(task-${task.taskNumber ?? task.title})`;

  const changeRequestSection =
    changeRequests && changeRequests.length > 0
      ? `\n## Change Requests (from reviewer):
${changeRequests.map((r, i) => `${i + 1}. ${r}`).join("\n")}

IMPORTANT: This task was already implemented. The branch "${branchName}" has commits from a previous run. Focus ONLY on addressing the change requests above. Do NOT redo work that was already completed successfully.\n`
      : "";

  return `You are in IMPLEMENTATION MODE. DIRECTLY edit source code files.

## Task: ${task.title}
## Description: ${task.description || "No description provided"}
${subtasksList}${changeRequestSection}

## Steps:
1. Read CLAUDE.md to understand the codebase
2. Implement changes by editing source code files
3. Update CLAUDE.md if you made major changes
4. Run the build command (e.g. npm run build / pnpm build) to verify there are no build errors. If there are errors, fix them and re-run the build until it passes cleanly.
5. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "${commitScope}: ${task.title}"
6. Run: git push -u origin ${branchName}

## Proof of Completion (REQUIRED):
After pushing, capture visual proof of your changes using agent-browser.
Skip entirely if your changes are backend-only with no UI impact. Do NOT mention proof capture in your response or commit message.

### How to decide WHAT to capture:
- Think about which page/route your changes affect. If you edited a settings form, navigate to /settings. If you changed a dashboard widget, go to /dashboard.
- Look at the files you modified — map them to the routes/pages they render.
- Always navigate to the SPECIFIC page that demonstrates your change, never just screenshot the homepage or a random page.

### Steps:
1. Run \`agent-browser set viewport 1920 1080\`
2. Start dev server in background, wait for ready
3. Navigate to the page that shows your change: \`agent-browser open http://localhost:3000/<relevant-route>\`
4. For simple/single-page changes: \`agent-browser screenshot --annotate\` and save to screenshots/ in repo root
5. For complex/multi-page changes: \`agent-browser record start recordings/proof.webm\`, then navigate through EACH affected page in sequence (open each route, wait for load, scroll to show changes), then \`agent-browser record stop\`
6. Kill the dev server
If dev server fails or page errors, screenshot the error state with \`agent-browser screenshot --annotate\` anyway.

## Rules:
- Do NOT create .md plan files or run lint/test/dev commands (except the build step above and dev server for proof)
- Use lockfile for package manager. GITHUB_TOKEN is set.
- Prefix shell commands with \`timeout <seconds>\` (e.g. \`timeout 30 npm install\`)
- For gh: \`GH_PROMPT_DISABLED=1 timeout 20 gh ...\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

type AuditFailure = {
  section: string;
  requirement: string;
  detail: string;
};

export function extractAuditFailures(rawResult: string): AuditFailure[] {
  try {
    const jsonStr =
      rawResult.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)?.[1]?.trim() ??
      rawResult.match(/\{[\s\S]*\}/)?.[0] ??
      rawResult;

    const raw: unknown = JSON.parse(jsonStr);
    return extractFailuresFromJson(raw);
  } catch {
    return [];
  }
}

export function buildAuditFixPrompt(
  failures: AuditFailure[],
  branchName: string,
  rootDirectory: string,
): string {
  const failureList = failures
    .map((f, i) => `${i + 1}. [${f.section}] ${f.requirement}: ${f.detail}`)
    .join("\n");

  return `You are fixing audit failures found in a post-implementation code audit. Fix ALL of the following issues to get all audit scores to 100%.

## Failed Audit Items:
${failureList}

## Instructions:
1. Read the CLAUDE.md file to understand the codebase
2. Read the relevant files to understand context around each failure
3. Fix each issue listed above with minimal, focused changes
4. Run the build command (e.g. npm run build / pnpm build) to verify there are no build errors. If there are errors, fix them and re-run the build until it passes cleanly.
5. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "audit: fix ${failures.length} issue${failures.length === 1 ? "" : "s"}"
6. Run: git push origin ${branchName}

## Rules:
- Only fix the specific issues listed above — do NOT refactor or change unrelated code
- Keep changes minimal and focused
- Use lockfile for package manager. GITHUB_TOKEN is set.
- Prefix shell commands with \`timeout <seconds>\` (e.g. \`timeout 30 npm install\`)
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

export type AuditFlags = {
  accessibility: boolean;
  testing: boolean;
  codeReview: boolean;
};

type AuditSectionDefinition = {
  name: string;
  description: string;
};

function getEnabledSections(flags: AuditFlags): AuditSectionDefinition[] {
  const sections: AuditSectionDefinition[] = [];
  if (flags.accessibility) {
    sections.push({
      name: "Accessibility",
      description:
        'WCAG checks (alt text, keyboard navigation, ARIA attributes, form labels, color contrast). If no frontend/UI code was changed, return a single item: { "requirement": "No UI changes", "passed": true, "detail": "No frontend code was modified" }.',
    });
  }
  if (flags.testing) {
    sections.push({
      name: "Testing",
      description:
        'Whether tests were added or needed. If changes are trivial config/docs, return: { "requirement": "Changes trivial", "passed": true, "detail": "No tests needed for this change" }.',
    });
  }
  if (flags.codeReview) {
    sections.push({
      name: "Code Review",
      description:
        "Implementation quality — correctness, bugs, security, error handling, naming, code style.",
    });
  }
  return sections;
}

export function buildAuditPrompt(diff: string, flags: AuditFlags): string {
  const sections = getEnabledSections(flags);

  const sectionDescriptions = sections
    .map((s, i) => `${i + 1}. **${s.name}**: ${s.description}`)
    .join("\n");

  const sectionJson = sections
    .map(
      (s) =>
        `    { "name": "${s.name}", "results": [{ "requirement": "...", "passed": true, "detail": "..." }] }`,
    )
    .join(",\n");

  return `You are a code auditor. Analyze this git diff and produce a JSON audit.

For each check, return { "requirement": "<check name>", "passed": true/false, "detail": "<1 sentence explanation>" }.

## Sections:
${sectionDescriptions}

Return ONLY valid JSON in this exact format:
{
  "sections": [
${sectionJson}
  ],
  "summary": "1-2 sentence overall assessment"
}

## Git Diff:
${diff.slice(0, 30000)}`;
}
