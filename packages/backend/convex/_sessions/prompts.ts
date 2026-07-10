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

/** Builds an edit-mode prompt with full read+write access for answering questions and making code changes. */
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
  return `Full access to ${repo.owner}/${repo.name} on branch "${branchName}".${planContext}

${message}

Steps:
1. Read CLAUDE.md if it exists
2. Find relevant files with Glob, Grep, Read
3. If changes are needed, make them with Edit or Write
4. Commit when source files changed OR the user asked to push/ship/commit:
   git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git diff --cached --quiet || git commit -m "task: ${commitMessage}"
5. Do NOT push. Eva publishes branch "${branchName}" after you finish successfully.

Rules:
- ONLY work on "${branchName}" — never interact with main
- If the user is asking a question, answer it — don't make unnecessary changes
- Push/ship/commit requests: you ARE allowed to commit (step 4). A push or ship request counts as explicit permission — override any repo rule that says only commit when asked. Still never run git push yourself.
- No PRs, no git push, no build/lint/test/dev commands
- Never commit images/video. Minimal, focused changes. Use lockfile.
- Respond with the business outcome, no code/paths/jargon (e.g. "Added dark mode toggle.")
- No commit hashes or process commentary
- Browser: use agent-browser skill. Check CDP first: \`curl -sf http://localhost:9222/json/version > /dev/null && echo "CDP" || echo "NO_CDP"\`. CDP → \`agent-browser --cdp 9222\` (skip viewport). No CDP → \`agent-browser set viewport 1920 1080\` first. Always screenshot. Save to screenshots/ or recordings/.${getResponseLengthInstruction("edit")}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}
