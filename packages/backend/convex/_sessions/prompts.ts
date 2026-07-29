import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
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
  // Same shape as Claude/Codex plan mode: explore, write an implementation
  // plan, do not implement yet. Eva harvests plan.md into session.planContent.
  return `Plan mode for ${repo.owner}/${repo.name}. Explore with Glob, Grep, Read.

Current plan.md:
${existingPlan || "None yet."}

User: ${message}

Create/update plan.md with a detailed implementation plan: goal, approach, files to touch, steps, risks/open questions. Refine iteratively — don't rewrite unless asked.

Rules:
- ONLY write plan.md — no other files
- Do NOT implement the plan
- Do NOT commit or push${getResponseLengthInstruction("plan")}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}

/** Eva-specific session constraints; exploration is left to the claude_code factory preset. */
export function buildEditPrompt(
  repo: { owner: string; name: string; baseBranch?: string },
  branchName: string,
  planContent: string,
  message: string,
  rootDirectory: string,
  customInstructionsBlock: string,
  systemPrompt: string | undefined,
  captureProof: boolean,
): string {
  const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
  const baseBranch = repo.baseBranch ?? FALLBACK_GIT_BASE_BRANCH;
  const planContext = planContent
    ? `\n\nApproved plan:\n${planContent}\n\nFollow this plan when implementing.`
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
3. Record a walkthrough: \`agent-browser record start /tmp/repo/recordings/proof.webm\` (ALWAYS absolute paths — relative paths resolve against the agent-browser daemon's cwd, not your shell's, and the file can land where Eva never finds it), step through each affected page (wait 5s per page, scroll to show the change), then \`agent-browser record stop\`. A few seconds after \`record start\`, verify the .webm exists and is growing (\`ls -la /tmp/repo/recordings/\`) — ffmpeg writes it progressively, so a missing/0-byte file means recording is broken (usually no ffmpeg); do NOT keep retrying, fall back to \`agent-browser screenshot /tmp/repo/screenshots/proof.png\`. Use screenshots only for a trivial change with nothing to demonstrate.
4. The capture must show the SPECIFIC change, not a generic page load. If it shows an error or the old state, debug once and re-capture. Kill the dev server when done.
Do NOT commit the recordings/ or screenshots/ files. Do NOT use create_artifact — Eva attaches the file to chat automatically.`
    : "";
  const browserSection = `

## Shared Browser (user-visible):
For browser verification or browsing the running app so the user can watch live:
1. Call eva MCP \`browser_start\` (starts the shared desktop Chrome with CDP on 9222).
2. Run \`agent-browser connect 9222\` once; all further agent-browser commands drive that Chrome.
3. Call \`browser_lock\` before interacting, \`browser_unlock\` when done.
4. Skip \`set viewport\` in this mode (Chrome is already 1920×1080).
If \`browser_start\` fails or is unavailable, fall back to plain headless agent-browser (current behavior).

## Recordings / screenshots in chat (required):
When the user asks for a recording, walkthrough video, or screenshot:
1. Write the file under \`/tmp/repo/recordings/\` (video: \`agent-browser record start /tmp/repo/recordings/<name>.webm\` … \`record stop\`) or \`/tmp/repo/screenshots/\` (stills). ALWAYS pass absolute paths — relative paths resolve against the agent-browser daemon's cwd, not your shell's. A few seconds after \`record start\`, verify the .webm exists and is growing (\`ls -la /tmp/repo/recordings/\`); a missing/0-byte file means recording is broken (usually no ffmpeg) — do not retry-loop, capture screenshots instead and tell the user.
2. Leave the file on disk when you finish the turn. Eva uploads it to Convex storage and renders it in chat with the video player (speed controls). Do not paste a URL instead.
3. Never use \`create_artifact\` (or any /artifacts/… link) for these captures — artifacts are for HTML docs, not session walkthrough media.
4. To embed a capture in a PR comment or Linear issue (GitHub/Linear cannot see chat attachments): eva MCP \`upload_media\` → curl the file to the returned uploadUrl → \`get_media_url\` for a permanent public link.`;
  return `${message}${planContext}${proofSection}${browserSection}

Eva session (${repo.owner}/${repo.name}, branch "${branchName}"):
- Do all work on "${branchName}". Never commit or push to main. Fetching/merging/rebasing/pulling from main into this branch is allowed when the user asks.
- If you change code: \`git add -A -- ':!*.png' ... ':!recordings/' && git diff --cached --quiet || git commit -m "task: ${commitMessage}"\`
- Duplicate/extract PR (when the user asks to ship this session's work as a separate PR that merges independently): never push this branch's commits to another ref — identical SHAs make GitHub auto-merge this session's PR. Instead squash onto a fresh branch: \`git fetch origin && git checkout -b eva/dup-<short-slug> origin/${baseBranch} && git merge --squash ${branchName} && git commit -m "<summary>" && git push -u origin HEAD && gh pr create --fill --base ${baseBranch} && git checkout ${branchName}\`. Base on "${baseBranch}" unless the user names a different base branch. Resolve squash conflicts if any. After that PR merges, merge the base branch into ${branchName} before continuing.
- Questions only: answer without unnecessary edits. No build/lint/test unless asked.
- Never commit images/video. Minimal changes.${getResponseLengthInstruction("edit")}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}
