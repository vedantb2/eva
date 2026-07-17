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
  repoOwner: string,
  repoName: string,
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
): string {
  const uiTask = detectUiImplementationTask({
    title: task.title,
    description: task.description,
  });
  const summarySection = implementationSummary?.trim()
    ? `\n## Implementation summary (from the coding agent):\n${implementationSummary.trim()}\n`
    : "";

  return `You are in PROOF CAPTURE MODE. Do NOT edit source code, commit, or push.

The implementation is already committed on this branch. Your only job is to capture visual proof of the change using agent-browser.

## Task: ${task.title}
## Description: ${task.description || "No description provided"}
${summarySection}
## How to decide WHAT to capture:
- Think about which page/route the changes affect. If a settings form was edited, navigate to /settings. If a dashboard widget changed, go to /dashboard.
- Look at recently modified files — map them to the routes/pages they render.
- Always navigate to the SPECIFIC page that demonstrates the change, never just screenshot the homepage or a random page.
${buildUiProofCaptureHint(uiTask)}

## Steps (default: video):
1. Clear any leftover captures: \`rm -rf recordings screenshots && mkdir -p recordings screenshots\`
2. Run \`agent-browser set viewport 1920 1080\`
3. Start the dev server in the background, wait for ready
4. Navigate to the page that shows the change: \`agent-browser open http://localhost:3000/<relevant-route>\`
5. Wait minimum 5 seconds after each navigation for the page to fully render before capturing or navigating further.
6. Record a video walkthrough: \`agent-browser record start recordings/proof.webm\`, navigate through each affected page in sequence (open each route, wait 5s for load, scroll to show changes), then \`agent-browser record stop\`
7. Screenshot fallback only when video is impractical (e.g. a tiny copy tweak with no meaningful interaction to show): \`agent-browser screenshot\` and save to screenshots/ in repo root. If in doubt, record a video.
8. **Verify proof quality**: Review the recording (or screenshot) output. The capture must show the SPECIFIC UI element or behavior that changed — a generic page load is not sufficient. If the capture shows an error, loading spinner, or the old state, debug once and re-capture.
9. Kill the dev server
If the dev server fails or the page errors, screenshot the error state with \`agent-browser screenshot\` anyway.
If the change is EXCLUSIVELY backend logic with no rendering impact (e.g. a cron job, a migration, an internal API rate limit), do not invent UI proof — exit successfully without captures.

## Rules:
- Do NOT edit source files, run typecheck, commit, or push
- Do NOT mention proof capture in any commit message (you must not commit)
- Prefix shell commands with timeouts where appropriate
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}${buildSystemPromptBlock(systemPrompt)}`;
}

/** Builds a prompt for resolving merge conflicts against the base branch. */
export function buildConflictResolutionPrompt(
  branchName: string,
  baseBranch: string,
  rootDirectory: string,
  repoOwner: string,
  repoName: string,
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
