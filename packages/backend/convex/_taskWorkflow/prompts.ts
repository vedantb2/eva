import type { Id } from "../_generated/dataModel";
import {
  buildImplementationSteps,
  buildSummarySection,
  buildUiProofCaptureHint,
  detectUiImplementationTask,
} from "./uiImplementationPrompt";
import {
  buildRootDirectoryInstruction,
  buildSystemPromptBlock,
} from "../prompts";
import { extractFailuresFromJson } from "./auditParser";

export const WORKSPACE_DIR = "/tmp/repo";

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function buildTypecheckCommand(rootDirectory: string): string {
  const typecheckDirectory = rootDirectory
    ? `${WORKSPACE_DIR}/${rootDirectory}`
    : WORKSPACE_DIR;
  return `cd ${shellSingleQuote(typecheckDirectory)} && { status=0; timeout --kill-after=10s 120s npx tsc --noEmit --pretty false > /tmp/eva-tsc.log 2>&1 || status=$?; tail -50 /tmp/eva-tsc.log; exit "$status"; }`;
}

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

/**
 * A reviewer change request prepared for a re-run prompt.
 * `commitText` is the mention-resolved request used for the edit commit subject;
 * `promptText` is the author/date-annotated version shown to the agent. Keeping
 * them separate stops the `[author · date]` annotation leaking into commits.
 */
export type ChangeRequestPromptInput = {
  commitText: string;
  promptText: string;
};

/** Builds the full implementation prompt sent to the AI agent in the sandbox. */
export function buildImplementationPrompt(
  task: { title: string; description?: string; taskNumber?: number },
  branchName: string,
  isQuickTask: boolean,
  rootDirectory: string,
  _repoOwner: string,
  _repoName: string,
  changeRequests?: ChangeRequestPromptInput[],
  projectContext?: { title: string; description?: string },
  systemPrompt?: string,
  previousRunSummary?: string,
): string {
  const commitScope = isQuickTask
    ? "feat"
    : `feat(task-${task.taskNumber ?? task.title})`;
  const latestChangeRequest =
    changeRequests?.[changeRequests.length - 1]?.commitText.trim();
  const editCommitTitle = latestChangeRequest
    ? latestChangeRequest
        .replace(/\s+/g, " ")
        .replace(/"/g, '\\"')
        .slice(0, 120)
    : task.title;
  const commitMessage = changeRequests?.length
    ? `edit: ${editCommitTitle}`
    : `${commitScope}: ${task.title}`;
  const typecheckCommand = buildTypecheckCommand(rootDirectory);
  const uiTask = detectUiImplementationTask({
    title: task.title,
    description: task.description,
  });

  const previousRunSection = previousRunSummary
    ? `\n\n### What the previous run completed:\n${previousRunSummary}`
    : "";
  const changeRequestSection =
    changeRequests && changeRequests.length > 0
      ? `\n## Change Requests (from reviewer):
${changeRequests.map((r, i) => `${i + 1}. ${r.promptText}`).join("\n")}

IMPORTANT: This task was already implemented. The branch "${branchName}" has commits from a previous run. Focus ONLY on addressing the change requests above. Do NOT redo work that was already completed successfully.${previousRunSection}\n`
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
${buildImplementationSteps(typecheckCommand, commitMessage, branchName, uiTask)}

${buildSummarySection(uiTask)}

## Rules:
- Do NOT create .md plan files or run lint/test/dev commands (except typecheck in step 3)
- Do NOT commit or push if typecheck fails. Fix the errors first.
- Do NOT run git push or gh pr commands. Eva handles publishing and PR creation after your successful completion.
- Do NOT capture screenshots or videos — a separate proof step runs after your commit.
- Use lockfile for package manager.
- Prefix shell commands with timeouts: \`timeout 180 npm install\`, \`timeout 30 gh ...\`
- For gh: \`GH_PROMPT_DISABLED=1 timeout 30 gh ...\`
- Do NOT pipe long-running validation commands through \`tail\`; redirect output to a log file, wait for the command to exit, then tail the log.
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}${buildSystemPromptBlock(systemPrompt)}`;
}

/** Builds a proof-only prompt: capture visual evidence after implementation (no code edits). */
export function buildProofPrompt(
  task: { title: string; description?: string },
  rootDirectory: string,
  implementationSummary?: string | null,
  systemPrompt?: string,
  runtime?: { devPort?: number; devCommand?: string },
): string {
  const uiTask = detectUiImplementationTask({
    title: task.title,
    description: task.description,
  });
  const summarySection = implementationSummary?.trim()
    ? `\n## Implementation summary (from the coding agent):\n${implementationSummary.trim()}\n`
    : "";
  const devPort = runtime?.devPort ?? 3000;
  const devCommand = runtime?.devCommand?.trim() || "pnpm run dev";
  const appUrl = `http://localhost:${devPort}`;

  return `You are in PROOF CAPTURE MODE. Do NOT edit source code, commit, or push.

The implementation is already committed on this branch. Your job is to read the git diff, decide exactly what UI changed, then capture that with agent-browser.

## Task: ${task.title}
## Description: ${task.description || "No description provided"}
${summarySection}
## Runtime (platform may have started these — still verify):
- App URL: ${appUrl}
- Dev command (if the app is not listening): \`${devCommand}\` in the background, then wait until ${appUrl} responds
- Background services (Convex / local backend / etc.) must be running so new functions from this branch are deployed. If the page shows Convex errors ("Could not find public function", "Server Error", missing query/mutation, connection refused), check \`/tmp/bg-*.log\` and \`pgrep -af convex\`, restart the repo background command if needed, wait for deploy to finish, then reload before capturing.

## Step 0 — Review the diff (REQUIRED before any capture):
1. \`cd /tmp/repo && git log --oneline -5\`
2. \`git show --stat HEAD\` (and \`git show HEAD\` / \`git diff HEAD~1..HEAD\` for the hunks)
3. From the diff, write a short plan before capturing:
   - Which files changed
   - Which user-visible UI each file affects (label, badge, table cell, route, copy, etc.)
   - Which URL path(s) to open on ${appUrl}
   - What must be visible in the capture for a reviewer to confirm the diff
4. Do NOT skip this. Do NOT capture a random page. The capture must match the diff.
${buildUiProofCaptureHint(uiTask)}

## Capture paths (REQUIRED — repo root, not the app subdirectory):
- Write ONLY to \`/tmp/repo/recordings/\` and \`/tmp/repo/screenshots/\`
- Clear leftovers first: \`rm -rf /tmp/repo/recordings /tmp/repo/screenshots && mkdir -p /tmp/repo/recordings /tmp/repo/screenshots\`

## Steps (after the diff plan):
1. Clear capture dirs as above
2. Run \`agent-browser set viewport 1920 1080\`
3. Confirm the app is up on ${appUrl} (curl or open). If not, start \`${devCommand}\` in the background and wait for ready
4. Confirm backend services are healthy (no Convex/runtime error banners on a simple page load). Fix/restart before capturing
5. Open the route(s) from your diff plan: \`agent-browser open ${appUrl}/<route-from-diff>\`
6. Wait minimum 5 seconds after each navigation for the page to fully render
7. Default: record a video that shows the changed UI from the diff: \`agent-browser record start /tmp/repo/recordings/proof.webm\`, navigate/scroll so the changed element is obvious, then \`agent-browser record stop\`
8. For tiny copy/style tweaks, a screenshot of the exact changed element is enough: \`agent-browser screenshot\` → \`/tmp/repo/screenshots/proof.png\`. Even a one-character text change must be captured on the live page.
9. **Verify against the diff (required):** Re-read the diff plan. The capture MUST show the same UI the hunks changed (e.g. if the diff adds a badge next to a filename, the badge must be in frame). Reject and re-capture if you see Convex/runtime errors, "Server Error", loading spinner, blank/error boundary, or a page that does not show the diff. Fix the stack and re-capture once.
10. Leave the app/backend running (do not kill them)

Only if the diff is EXCLUSIVELY non-rendering backend (cron, migration, internal API with no UI) may you exit without captures — and you must still have run the git review above.

## Rules:
- Do NOT edit source files, run typecheck, commit, or push
- Do NOT mention proof capture in any commit message (you must not commit)
- Prefix shell commands with timeouts where appropriate
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}${buildSystemPromptBlock(systemPrompt)}`;
}

/**
 * Second-chance proof prompt after a turn left no media. Forces a real file
 * under /tmp/repo even for tiny UI tweaks — skipping capture is not allowed.
 */
export function buildProofRetryPrompt(
  task: { title: string; description?: string },
  rootDirectory: string,
  runtime?: { devPort?: number; devCommand?: string },
): string {
  const devPort = runtime?.devPort ?? 3000;
  const devCommand = runtime?.devCommand?.trim() || "pnpm run dev";
  const appUrl = `http://localhost:${devPort}`;

  return `You are in PROOF CAPTURE RETRY MODE. The previous proof turn left NO media files. That is unacceptable.

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}

You MUST leave at least one file before you finish:
- Prefer: \`/tmp/repo/recordings/proof.webm\` (video walkthrough)
- Or: \`/tmp/repo/screenshots/proof.png\` (screenshot of the changed UI from the diff)

Steps:
1. Review the diff first: \`cd /tmp/repo && git show --stat HEAD && git show HEAD\` — note the exact UI/route the hunks change
2. \`rm -rf /tmp/repo/recordings /tmp/repo/screenshots && mkdir -p /tmp/repo/recordings /tmp/repo/screenshots\`
3. Ensure the app is up at ${appUrl} (start \`${devCommand}\` in the background if needed). Ensure Convex/backend is healthy — do not capture error pages.
4. \`agent-browser set viewport 1920 1080\`
5. Open the route implied by the diff, wait 5s, and capture that changed UI (even a one-character copy change)
6. \`ls -la /tmp/repo/recordings /tmp/repo/screenshots\` and confirm a non-empty file exists that shows the diff

Do NOT exit without a media file. Do NOT edit source, commit, or push.${buildRootDirectoryInstruction(rootDirectory)}`;
}

/** Builds a prompt for resolving merge conflicts against the base branch. */
export function buildConflictResolutionPrompt(
  branchName: string,
  baseBranch: string,
  rootDirectory: string,
  _repoOwner: string,
  _repoName: string,
  systemPrompt?: string,
): string {
  return `You are resolving merge conflicts. Do NOT re-implement or change any feature — only resolve conflicts and ensure compatibility with the latest base branch.

## Steps:
1. Run: git fetch origin
2. Run: git merge origin/${baseBranch}
3. If there are merge conflicts, resolve them — keep the task branch's implementation intent intact but adapt it to work with the latest base branch changes
4. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "fix: resolve merge conflicts with ${baseBranch}"
5. Do NOT push. The platform publishes branch "${branchName}" after you finish successfully.

## Rules:
- Do NOT re-implement or change the feature — only resolve conflicts and ensure compatibility
- Keep the task's implementation intent intact
- Do NOT run git push or gh pr commands. Eva handles publishing and PR creation after your successful completion.
- Use lockfile for package manager.
- Prefix shell commands with \`timeout <seconds>\` (e.g. \`timeout 30 npm install\`)
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}${buildSystemPromptBlock(systemPrompt)}`;
}

type AuditFailure = {
  section: string;
  requirement: string;
  detail: string;
  severity?: "critical" | "high" | "medium" | "low";
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
): string {
  const typecheckCommand = buildTypecheckCommand(rootDirectory);
  const failureList = failures
    .map((f, i) => {
      const severityPrefix = f.severity ? `[${f.severity.toUpperCase()}] ` : "";
      return `${i + 1}. ${severityPrefix}[${f.section}] ${f.requirement}: ${f.detail}`;
    })
    .join("\n");

  return `You are fixing audit failures found in a post-implementation code audit. Fix ALL of the following issues to get all audit scores to 100%.

## Failed Audit Items:
${failureList}

## Instructions:
1. Read the CLAUDE.md file to understand the codebase
2. Read the relevant files to understand context around each failure
3. Fix each issue listed above with minimal, focused changes
4. Run \`${typecheckCommand}\` to verify no type errors. If errors occur, read the output, fix every issue, and re-run (max 3 attempts). Do NOT run a full build (\`pnpm build\`, \`npm run build\`, \`vite build\`) — it exceeds sandbox memory and time limits.
5. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "audit: fix ${failures.length} issue${failures.length === 1 ? "" : "s"}"
6. Do NOT push. Eva publishes branch "${branchName}" after you finish successfully.

## Rules:
- Only fix the specific issues listed above — do NOT refactor or change unrelated code
- Keep changes minimal and focused
- Do NOT run git push or gh pr commands. Eva handles publishing after your successful completion.
- Use lockfile for package manager.
- Prefix shell commands with timeouts: \`timeout 120 npm install\`, \`timeout 30 gh ...\`
- For gh: \`GH_PROMPT_DISABLED=1 timeout 30 gh ...\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`
${buildRootDirectoryInstruction(rootDirectory)}`;
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
