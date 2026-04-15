import type { Id } from "../_generated/dataModel";
import { buildRootDirectoryInstruction } from "../prompts";
import { extractFailuresFromJson } from "./auditParser";

export const WORKSPACE_DIR = "/tmp/repo";

/** Builds a user-facing notification message for a workflow run completion. */
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

/** Builds the full implementation prompt sent to the AI agent in the sandbox. */
export function buildImplementationPrompt(
  task: { title: string; description?: string; taskNumber?: number },
  branchName: string,
  isQuickTask: boolean,
  rootDirectory: string,
  screenshotsVideosEnabled: boolean,
  repoOwner: string,
  repoName: string,
  changeRequests?: string[],
  projectContext?: { title: string; description?: string },
): string {
  const commitScope = isQuickTask
    ? "feat"
    : `feat(task-${task.taskNumber ?? task.title})`;
  const latestChangeRequest =
    changeRequests?.[changeRequests.length - 1]?.trim();
  const editCommitTitle = latestChangeRequest
    ? latestChangeRequest
        .replace(/\s+/g, " ")
        .replace(/"/g, '\\"')
        .slice(0, 120)
    : task.title;
  const commitMessage = changeRequests?.length
    ? `edit: ${editCommitTitle}`
    : `${commitScope}: ${task.title}`;

  const changeRequestSection =
    changeRequests && changeRequests.length > 0
      ? `\n## Change Requests (from reviewer):
${changeRequests.map((r, i) => `${i + 1}. ${r}`).join("\n")}

IMPORTANT: This task was already implemented. The branch "${branchName}" has commits from a previous run. Focus ONLY on addressing the change requests above. Do NOT redo work that was already completed successfully.\n`
      : "";
  const proofOfCompletionSection = screenshotsVideosEnabled
    ? `
## Proof of Completion (REQUIRED):
After committing, capture visual proof of your changes using agent-browser.
The platform handles the branch push after you finish successfully.
Assume proof is needed unless your changes are EXCLUSIVELY backend logic with no rendering impact (e.g. a cron job, a migration, an internal API rate limit).
Do NOT mention proof capture in your response or commit message.

### How to decide WHAT to capture:
- Think about which page/route your changes affect. If you edited a settings form, navigate to /settings. If you changed a dashboard widget, go to /dashboard.
- Look at the files you modified — map them to the routes/pages they render.
- Always navigate to the SPECIFIC page that demonstrates your change, never just screenshot the homepage or a random page.

### Steps:
1. Run \`agent-browser set viewport 1920 1080\`
2. Start dev server in background, wait for ready
3. Navigate to the page that shows your change: \`agent-browser open http://localhost:3000/<relevant-route>\`
4. Wait minimum 5 seconds after each navigation for the page to fully render before capturing or navigating further.
5. For multi-step changes: \`agent-browser record start recordings/proof.webm\`, then navigate through EACH affected page in sequence (open each route, wait 5s for load, scroll to show changes), then \`agent-browser record stop\`
6. For extremely simple changes: \`agent-browser screenshot --annotate\` and save to screenshots/ in repo root
7. Always prefer recording a video walkthrough of the change, screenshot only if the change is very minor or hard to capture in video (e.g. a small text change). If in doubt, record a video.
8. **Verify proof quality**: Review the screenshot/recording output. The capture must show the SPECIFIC UI element or behavior that changed — a generic page load is not sufficient. If the capture shows an error, loading spinner, or the old state, debug once and re-capture.
9. Kill the dev server
If dev server fails or page errors, screenshot the error state with \`agent-browser screenshot --annotate\` anyway.`
    : "";

  const projectSection = projectContext
    ? `## Project: ${projectContext.title}${projectContext.description ? `\n${projectContext.description}` : ""}

`
    : "";

  return `You are in IMPLEMENTATION MODE. DIRECTLY edit source code files.

${projectSection}## Task: ${task.title}
## Description: ${task.description || "No description provided"}
${changeRequestSection}

## Steps:
1. Read the files you plan to modify before editing them — understand existing code first
2. Implement changes by editing source code files
3. Run the build command to verify no build errors. If errors, fix and re-run (max 3 attempts — if still failing, commit what you have and report the error)
4. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "${commitMessage}"
5. Run: git remote set-url origin "https://x-access-token:$GITHUB_TOKEN@github.com/${repoOwner}/${repoName}.git" && git push -u origin ${branchName}

## Summary (REQUIRED):
After committing and pushing, write a brief summary of the changes you made and why.
${proofOfCompletionSection}

## Rules:
- Do NOT create .md plan files or run lint/dev commands (except the build/test steps above and dev server for proof when proof capture is enabled)
- Use lockfile for package manager. GITHUB_TOKEN is set.
- Prefix shell commands with timeouts: \`timeout 120 npm install\`, \`timeout 60 npm run build\`, \`timeout 60 npm test\`, \`timeout 30 gh ...\`
- For gh: \`GH_PROMPT_DISABLED=1 timeout 30 gh ...\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

/** Builds a prompt for resolving merge conflicts against the base branch. */
export function buildConflictResolutionPrompt(
  branchName: string,
  baseBranch: string,
  rootDirectory: string,
  repoOwner: string,
  repoName: string,
): string {
  return `You are resolving merge conflicts. Do NOT re-implement or change any feature — only resolve conflicts and ensure compatibility with the latest base branch.

## Steps:
1. Run: git fetch origin
2. Run: git merge origin/${baseBranch}
3. If there are merge conflicts, resolve them — keep the task branch's implementation intent intact but adapt it to work with the latest base branch changes
4. Run the build command (e.g. npm run build / pnpm build) to verify there are no build errors. If there are errors, fix them and re-run the build until it passes cleanly.
5. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "fix: resolve merge conflicts with ${baseBranch}"
6. Run: git remote set-url origin "https://x-access-token:$GITHUB_TOKEN@github.com/${repoOwner}/${repoName}.git" && git push -u origin ${branchName}

## Rules:
- Do NOT re-implement or change the feature — only resolve conflicts and ensure compatibility
- Keep the task's implementation intent intact
- Use lockfile for package manager. GITHUB_TOKEN is set.
- Prefix shell commands with \`timeout <seconds>\` (e.g. \`timeout 30 npm install\`)
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

type AuditFailure = {
  section: string;
  requirement: string;
  detail: string;
};

/** Parses raw audit result text and extracts the list of failed audit items. */
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

/** Builds a prompt instructing the AI agent to fix specific audit failures. */
export function buildAuditFixPrompt(
  failures: AuditFailure[],
  branchName: string,
  rootDirectory: string,
  repoOwner: string,
  repoName: string,
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
6. Run: git remote set-url origin "https://x-access-token:$GITHUB_TOKEN@github.com/${repoOwner}/${repoName}.git" && git push -u origin ${branchName}

## Rules:
- Only fix the specific issues listed above — do NOT refactor or change unrelated code
- Keep changes minimal and focused
- Use lockfile for package manager. GITHUB_TOKEN is set.
- Prefix shell commands with \`timeout <seconds>\` (e.g. \`timeout 30 npm install\`)
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

type AuditCategory = {
  name: string;
  description: string;
};

/** Builds the code audit prompt with category descriptions and expected JSON output format. */
export function buildAuditPrompt(categories: AuditCategory[]): string {
  const sectionDescriptions = categories
    .map((s, i) => `${i + 1}. **${s.name}**: ${s.description}`)
    .join("\n");

  const sectionJson = categories
    .map(
      (s) =>
        `    { "name": "${s.name}", "results": [{ "requirement": "...", "passed": true, "detail": "...", "severity": "medium" }] }`,
    )
    .join(",\n");

  return `You are a code auditor. Audit the changes made in this branch.

Focus ONLY on the changes in this branch — use git diff against the base branch to identify what was changed. You have full access to the repository, so read files, run skills, and use any tools you need to perform a thorough audit.

## Audit categories:
${sectionDescriptions}

For each category, produce a list of findings. Each finding should have a requirement name, whether it passed, a 1-sentence explanation, and a severity level ("critical", "high", "medium", or "low").

Severity guidelines:
- **critical**: Security vulnerabilities, data loss risks, broken core functionality
- **high**: Significant bugs, performance issues, accessibility violations
- **medium**: Code quality issues, missing tests, minor bugs
- **low**: Style issues, minor improvements, nice-to-haves

When you are done, output ONLY valid JSON in this exact format:
{
  "sections": [
${sectionJson}
  ],
  "summary": "1-2 sentence overall assessment"
}`;
}
