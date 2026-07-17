import {
  buildRootDirectoryInstruction,
  buildSystemPromptBlock,
  getResponseLengthInstruction,
} from "../prompts";

/** Builds a plan-mode prompt for creating or refining a plan.md document. */
export function buildPlanPrompt(
  repo: { owner: string; name: string },
  existingPlan: string,
  message: string,
  rootDirectory: string,
  customInstructionsBlock: string,
  systemPrompt: string | undefined,
): string {
  return `PRD planning for ${repo.owner}/${repo.name}. Explore with Glob, Grep, Read.

Current plan.md:
${existingPlan || "None yet."}

User: ${message}

Create/update plan.md with: Overview, Goals, User Stories, Acceptance Criteria, Scope, Out of Scope. Refine iteratively — don't rewrite unless asked.

Rules:
- ONLY write plan.md — no other files
- Non-technical: WHAT and WHY, not HOW
- Do NOT commit or push${getResponseLengthInstruction("plan")}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}

/** Minimal prompt for direct Q&A — SDK one-shot sets system prompt; user text only. */
export function buildConversationalPrompt(
  message: string,
  customInstructionsBlock: string,
  systemPrompt: string | undefined,
): string {
  const suffix = `${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}`;
  return suffix.length > 0 ? `${message}${suffix}` : message;
}

/** Eva-specific session constraints; exploration is left to the claude_code factory preset. */
export function buildEditPrompt(
  repo: { owner: string; name: string },
  branchName: string,
  planContent: string,
  message: string,
  rootDirectory: string,
  customInstructionsBlock: string,
  systemPrompt: string | undefined,
  captureProof: boolean,
): string {
  const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
  const planContext = planContent
    ? `\n\nApproved plan:\n${planContent}\n\nFollow the goals, user stories, and acceptance criteria above.`
    : "";
  // When the session has "Capture proof" enabled, ask the agent to record
  // visual proof after committing. The sandbox callback runtime scans
  // recordings/ and screenshots/ after the run and attaches the media to the
  // assistant message automatically — so this is prompt-only.
  const proofSection = captureProof
    ? `

## Proof of Completion:
After committing, capture visual proof with agent-browser:
1. Start the dev server in the background and wait until it is ready.
2. Navigate to the affected route: \`agent-browser open http://localhost:3000/<relevant-route>\` and wait 5s for it to render.
3. Record a walkthrough: \`agent-browser record start recordings/proof.webm\`, step through each affected page (wait 5s per page, scroll to show the change), then \`agent-browser record stop\`. Use \`agent-browser screenshot\` into screenshots/ only for a trivial change with nothing to demonstrate.
4. The capture must show the SPECIFIC change, not a generic page load. If it shows an error or the old state, debug once and re-capture. Kill the dev server when done.
Do NOT commit the recordings/ or screenshots/ files.`
    : "";
  return `${message}${planContext}${proofSection}

Eva session (${repo.owner}/${repo.name}, branch "${branchName}"):
- Do all work on "${branchName}". Never commit or push to main. Fetching/merging/rebasing/pulling from main into this branch is allowed when the user asks.
- If you change code: \`git add -A -- ':!*.png' ... ':!recordings/' && git diff --cached --quiet || git commit -m "task: ${commitMessage}"\`
- Questions only: answer without unnecessary edits. No build/lint/test unless asked.
- Never commit images/video. Minimal changes.${getResponseLengthInstruction("edit")}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}
