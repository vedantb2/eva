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
): string {
  const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
  const planContext = planContent
    ? `\n\nApproved plan:\n${planContent}\n\nFollow the goals, user stories, and acceptance criteria above.`
    : "";
  return `${message}${planContext}

Eva session (${repo.owner}/${repo.name}, branch "${branchName}"):
- Only work on "${branchName}" — never interact with main.
- Do not git pull, git push, or run ship/PR skills — Eva publishes "${branchName}" after you finish. Commit only.
- If you change code: \`git add -A -- ':!*.png' ... ':!recordings/' && git diff --cached --quiet || git commit -m "task: ${commitMessage}"\`
- Questions only: answer without unnecessary edits. No build/lint/test unless asked.
- Never commit images/video. Minimal changes.${getResponseLengthInstruction("edit")}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}
