import { buildRootDirectoryInstruction } from "../prompts/shared";

/** Builds a write-mode prompt for automations that edit code and commit locally. */
export function buildAutomationPrompt(
  title: string,
  description: string,
  branchName: string,
  rootDirectory: string,
): string {
  return `You are in IMPLEMENTATION MODE. DIRECTLY edit source code files.

## Automation: ${title}
## Prompt: ${description}

## Steps:
1. Read the files you plan to modify before editing them — understand existing code first
2. Implement changes by editing source code files
3. Run the build command to verify no build errors. If errors, fix and re-run (max 3 attempts — if still failing, commit what you have and report the error)
4. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "automation: ${title.replace(/"/g, '\\"')}"
5. Do NOT push. Eva publishes branch "${branchName}" after you finish successfully.

## Summary (REQUIRED):
After committing, write a brief summary of the changes you made. This will be added to the PR description.

## Rules:
- Do NOT create .md plan files or run lint/dev commands (except the build step above)
- Do NOT use agent-browser, take screenshots, or record videos
- Do NOT run audits
- Do NOT run git push or gh pr commands
- Use lockfile for package manager.
- Prefix shell commands with timeouts: \`timeout 120 npm install\`, \`timeout 60 npm run build\`, \`timeout 60 npm test\`, \`timeout 30 gh ...\`
- For gh: \`GH_PROMPT_DISABLED=1 timeout 30 gh ...\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

/** Builds a read-only prompt for automations that analyze the codebase without modifying files. */
export function buildReadOnlyPrompt(
  title: string,
  description: string,
  rootDirectory: string,
): string {
  return `You are in READ-ONLY / REPORT MODE. Do NOT modify any files, do NOT commit, do NOT push, do NOT create branches or PRs.

## Automation: ${title}
## Prompt: ${description}

## Steps:
1. Read and analyze the codebase to answer the prompt
2. You may run read-only commands (e.g. grep, find, cat, ls, git log, git diff, npm test, npm run build) to gather information
3. Write a detailed report/analysis as your final output

## Report (REQUIRED):
Provide a clear, structured report answering the prompt. This is the only output — no code changes.

## Rules:
- Do NOT edit, write, or create any files
- Do NOT run git add, git commit, git push, or any git commands that modify state
- Do NOT use agent-browser, take screenshots, or record videos
- Do NOT run audits
- Prefix shell commands with timeouts: \`timeout 60 npm run build\`, \`timeout 60 npm test\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}

/** Builds a read-only prompt that produces structured JSON findings for actionable follow-up. */
export function buildActionableReportPrompt(
  title: string,
  description: string,
  rootDirectory: string,
): string {
  return `You are in READ-ONLY / REPORT MODE with STRUCTURED FINDINGS. Do NOT modify any files, do NOT commit, do NOT push, do NOT create branches or PRs.

## Automation: ${title}
## Prompt: ${description}

## Steps:
1. Read and analyze the codebase to answer the prompt
2. You may run read-only commands (e.g. grep, find, cat, ls, git log, git diff, npm test, npm run build) to gather information
3. Identify discrete, actionable findings
4. Output your findings as structured JSON (see format below)

## Findings Output (REQUIRED):
At the END of your response, output a JSON array of findings inside a fenced code block, preceded by the marker \`<!-- FINDINGS_JSON -->\`.

Each finding must have:
- \`title\`: short summary of the issue (1 line)
- \`description\`: detailed explanation of the issue
- \`severity\`: one of "low", "medium", "high", "critical"
- \`filePaths\`: array of relevant file paths (optional but preferred)
- \`suggestedFix\`: how to fix this issue (optional but preferred)

Example:
<!-- FINDINGS_JSON -->
\`\`\`json
[
  {
    "title": "Unhandled null reference in UserService",
    "description": "The getUserById method does not handle the case where the user is not found, leading to a null reference error.",
    "severity": "high",
    "filePaths": ["src/services/UserService.ts"],
    "suggestedFix": "Add a null check after the database query and return an appropriate error response."
  }
]
\`\`\`

You may include narrative text before the JSON block for context, but the JSON block MUST appear at the end.

## Rules:
- Do NOT edit, write, or create any files
- Do NOT run git add, git commit, git push, or any git commands that modify state
- Do NOT use agent-browser, take screenshots, or record videos
- Do NOT run audits
- Prefix shell commands with timeouts: \`timeout 60 npm run build\`, \`timeout 60 npm test\`
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${buildRootDirectoryInstruction(rootDirectory)}`;
}
