import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
import {
  buildRootDirectoryInstruction,
  buildSystemPromptBlock,
  RESPONSE_LENGTH_INSTRUCTION,
} from "../prompts";
import { stripMentionTokens } from "../_mentions/resolveDocMentions";

/**
 * Session chat no longer injects this block: Cursor resumes one agent and the
 * SDK compacts in place. The helper remains for tests and any caller that
 * still needs an explicit transcript digest.
 */
const HANDOFF_ENTRY_CHAR_CAP = 1_500;
const HANDOFF_ASSISTANT_ENTRY_LIMIT = 3;
const HANDOFF_TOTAL_CHAR_BUDGET = 24_000;

type HandoffMessage = { role: string; content: string };
type HandoffEntry = { isUser: boolean; line: string };

function handoffElisionMarker(count: number): string {
  return `[... ${count} earlier ${count === 1 ? "message" : "messages"} elided ...]`;
}

/** Renders the kept prefix, the elision marker, then the kept suffix. */
function handoffLines(
  entries: HandoffEntry[],
  head: number,
  tail: number,
): string[] {
  const elided = entries.length - head - tail;
  return [
    ...entries.slice(0, head).map((entry) => entry.line),
    ...(elided > 0 ? [handoffElisionMarker(elided)] : []),
    ...entries.slice(entries.length - tail).map((entry) => entry.line),
  ];
}

function handoffCost(
  entries: HandoffEntry[],
  head: number,
  tail: number,
): number {
  const lines = handoffLines(entries, head, tail);
  if (lines.length === 0) return 0;
  return (
    lines.reduce((total, line) => total + line.length, 0) +
    2 * (lines.length - 1)
  );
}

/**
 * Builds a chronological transcript digest: every user message plus the last
 * few assistant messages, each capped, trimmed to a total character budget by
 * dropping assistant entries first and then eliding the middle of the user
 * history (earliest and latest messages always survive).
 */
export function buildSessionHandoff(history: HandoffMessage[]): string {
  const all: HandoffEntry[] = [];
  for (const message of history) {
    const text = stripMentionTokens(message.content)
      .slice(0, HANDOFF_ENTRY_CHAR_CAP)
      .trim();
    if (!text) continue;
    const isUser = message.role === "user";
    all.push({ isUser, line: `${isUser ? "User" : "Assistant"}: ${text}` });
  }

  const keptAssistants = new Set(
    all
      .flatMap((entry, index) => (entry.isUser ? [] : [index]))
      .slice(-HANDOFF_ASSISTANT_ENTRY_LIMIT),
  );
  let entries = all.filter(
    (entry, index) => entry.isUser || keptAssistants.has(index),
  );

  // Over budget: assistant summaries go first, oldest first.
  while (
    handoffCost(entries, entries.length, 0) > HANDOFF_TOTAL_CHAR_BUDGET &&
    entries.some((entry) => !entry.isUser)
  ) {
    const oldestAssistant = entries.findIndex((entry) => !entry.isUser);
    entries = [
      ...entries.slice(0, oldestAssistant),
      ...entries.slice(oldestAssistant + 1),
    ];
  }

  let head = entries.length;
  let tail = 0;
  if (handoffCost(entries, head, tail) > HANDOFF_TOTAL_CHAR_BUDGET) {
    // Still over: elide from the middle outwards, keeping both ends.
    head = Math.ceil(entries.length / 2);
    tail = entries.length - head;
    while (
      handoffCost(entries, head, tail) > HANDOFF_TOTAL_CHAR_BUDGET &&
      head + tail > 2
    ) {
      if (head > tail) head -= 1;
      else tail -= 1;
    }
  }

  return handoffLines(entries, head, tail).join("\n\n");
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
  devPort?: number,
  conversationHistory: Array<{ role: string; content: string }> = [],
): string {
  const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
  const baseBranch = repo.baseBranch ?? FALLBACK_GIT_BASE_BRANCH;
  const planContext = planContent
    ? `\n\nApproved plan:\n${planContent}\n\nFollow this plan when implementing.`
    : "";
  const handoff = buildSessionHandoff(conversationHistory);
  const conversationContext = handoff
    ? `\n\nPrior instructions from this session (handoff; may overlap provider memory). Earlier instructions still apply unless the user has since changed them — do not undo agreed work:\n${handoff}`
    : "";
  const devPortText =
    devPort !== undefined ? String(devPort) : "its configured dev port";
  // Agents kept concluding "no dev server is running" seconds after a sandbox
  // start (a cold Next compile takes 1-2 minutes) and launching their own —
  // duplicate dev servers are what pushed 16GB VMs into OOM kills.
  const devServerSection = `

## App dev server (managed by Eva):
Eva auto-starts the app dev server in the Preview Console (tmux) on port ${devPortText} after every sandbox start, including the one that launched this turn. A cold compile takes 1-2 minutes, so an immediate check can look "down" while it is still warming up. To verify it, retry \`curl -sf http://localhost:${devPortText}\` for up to ~2 minutes before concluding anything. NEVER start your own dev server — a second instance has caused out-of-memory crashes on this VM. If the port still serves nothing after ~2 minutes, say so in your reply; Eva restarts it automatically.`;
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
2. Those two folders are DELIVERABLE-ONLY: every file still in them when the turn ends is uploaded and posted into the chat. Save working captures — page-state checks, login verification, "did my change render" screenshots — to \`/tmp/checks/\` instead, never to the deliverable folders. When you finish, the deliverable folders must contain exactly what the user asked for and nothing else.
3. Leave the deliverable files on disk when you finish the turn. Eva uploads them to Convex storage and renders them in chat with the video player (speed controls). Do not paste a URL instead. After posting, Eva moves each file into \`.posted/\` inside the same folder (e.g. \`/tmp/repo/screenshots/.posted/\`) — reuse those copies in later turns instead of recapturing. Never delete \`.posted/\`; copying a file from it back into the deliverable folder posts it to chat again.
4. Never use \`create_artifact\` (or any /artifacts/… link) for these captures — artifacts are for HTML docs, not session walkthrough media.
5. Never use \`pkill -f\`, \`pgrep -f\`, \`killall\`, or another broad command-line match to clean up ffmpeg, Chrome, or recording processes. The recording instructions are present in the parent agent's command line, so a broad match can terminate this turn. Stop recordings with \`agent-browser record stop\`. If you manually start a process, capture its exact PID when launching it and only stop that PID.
6. For "each" or "all features" requests, first make a checklist naming every feature, then create one isolated deliverable per checklist item unless the user asks for a combined walkthrough. Do not finish until every checklist item has a non-empty file in the deliverable folder.
7. A status update such as "recording now" is not a final answer. Finish the captures before replying, then list which attached file demonstrates each feature. If capture is impossible, report the concrete failure instead of promising future work.
8. To embed a capture in a PR comment or Linear issue (GitHub/Linear cannot see chat attachments): eva MCP \`upload_media\` → curl the file to the returned uploadUrl → \`get_media_url\` for a permanent public link. Captures posted in earlier turns are still on disk under \`.posted/\` — upload those instead of recapturing.`;
  return `${message}${planContext}${conversationContext}${devServerSection}${browserSection}

Eva session (${repo.owner}/${repo.name}, branch "${branchName}"):
- Do all work on "${branchName}". Do not commit or push to "${baseBranch}" or main unless the user asks for that explicitly. Fetching/merging/rebasing/pulling from "${baseBranch}" into this branch is allowed when the user asks.
- If you change code: \`git add -A -- ':!*.png' ... ':!recordings/' ':!plan.md' && git diff --cached --quiet || git commit -m "task: ${commitMessage}"\`
- Duplicate/extract PR (when the user asks to ship this session's work as a separate PR that merges independently): never push this branch's commits to another ref — identical SHAs make GitHub auto-merge this session's PR. Instead squash onto a fresh branch: \`git fetch origin && git checkout --no-track -b eva/dup-<short-slug> origin/${baseBranch} && git merge --squash ${branchName} && git commit -m "<summary>" && git push -u origin refs/heads/eva/dup-<short-slug>:refs/heads/eva/dup-<short-slug> && gh pr create --fill --base ${baseBranch} && git checkout ${branchName}\`. Always push by explicit refspec like that — never \`git push origin HEAD\` or a bare \`git push\`. Base on "${baseBranch}" unless the user names a different base branch. Resolve squash conflicts if any. After that PR merges, merge the base branch into ${branchName} before continuing.
- Questions only: answer without unnecessary edits. No build/lint/test unless asked.
- Never commit images/video or \`plan.md\`. Minimal changes.${RESPONSE_LENGTH_INSTRUCTION}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}
