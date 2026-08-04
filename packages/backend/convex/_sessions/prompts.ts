import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
import {
  buildRootDirectoryInstruction,
  buildSystemPromptBlock,
  getResponseLengthInstruction,
} from "../prompts";
import { buildDesignSystemPrompt } from "../prompts/design";
import { stripMentionTokens } from "../_mentions/resolveDocMentions";

const VARIATION_STRATEGIES = [
  "A: Clean/conventional — clarity, familiar patterns, straightforward navigation",
  "B: Creative/bold — unconventional layout, striking hierarchy, unique interactions",
  "C: Compact/efficient — high density, minimal chrome, space-efficient",
  "D: Immersive/visual — full-screen imagery, rich motion, cinematic feel",
  "E: Accessible/minimal — maximum legibility, highest contrast, simplified interactions",
];

/** Generates the Next.js router scaffold code for lazy-loading design variations. */
function buildRouterScaffold(labels: string[]): string {
  const entries = labels
    .map((l) => `  ${l}: lazy(() => import('./variations/variation-${l}')),`)
    .join("\n");
  return `\`\`\`tsx
'use client';
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const variations: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
${entries}
};

export default function DesignPreview() {
  const params = useSearchParams();
  const v = params.get('v') || '${labels[0]}';
  const Component = variations[v] || variations.${labels[0]};
  return <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><p>Loading...</p></div>}><Component /></Suspense>;
}
\`\`\``;
}

/** Builds the full design-mode turn prompt (persona, refine base, variation strategies). */
export function buildDesignPrompt(
  repo: { owner: string; name: string },
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  selectedBase: { label: string; filePath: string } | null,
  persona: { name: string; prompt: string } | null,
  rootDirectory: string,
  numDesigns: number,
  customInstructionsBlock: string,
): string {
  const labels = Array.from({ length: numDesigns }, (_, i) =>
    String.fromCharCode(97 + i),
  );
  const labelsBracketed = `{${labels.join(",")}}`;

  const history = conversationHistory
    .filter((m) => m.content)
    .slice(-6)
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${stripMentionTokens(m.content)}`,
    )
    .join("\n\n");

  const baseContext = selectedBase
    ? `\n\n## Selected Base Design
The user selected "${selectedBase.label}" as the base.
Read the file at: ${selectedBase.filePath}
IMPORTANT: Preserve the core layout structure, color choices, and interaction patterns from this base.
Only change what the user explicitly requests. Create ${numDesigns} refined variations of THIS design.`
    : "";

  const personaContext = persona
    ? `\n\n## Target Persona
Name: ${persona.name}
${persona.prompt}

Design with this persona in mind — consider their goals, context, and preferences.`
    : "";

  const strategies = VARIATION_STRATEGIES.slice(0, numDesigns)
    .map((s) => `- ${s}`)
    .join("\n");

  return `You are a UI/UX designer working on the ${repo.owner}/${repo.name} codebase.

## Your Task
Read the codebase to understand the existing design system, then write ${numDesigns} React component variation files based on the user's request.

## Steps
1. Invoke skills: /frontend-design, /interface-design, /web-design-guidelines
2. Discover the project's design system:
   - Read CLAUDE.md to understand the project
   - Search for styling config files (e.g. tailwind.config.*, globals.css, theme.ts, stitches.config.*, styled-components theme, CSS custom properties, etc.)
   - Read existing components to understand the styling approach, token naming, and visual patterns
   - Identify the CSS/styling framework in use and its semantic tokens
3. Check if app/design-preview/page.tsx exists. If not, create the router scaffold below
4. Write ${numDesigns} variation files to app/design-preview/variations/variation-${labelsBracketed}.tsx using ONLY the project's own design tokens
5. Output ONLY the JSON

## Router Scaffold (create if missing)
${buildRouterScaffold(labels)}

## Variation Strategies
${strategies}

## Design System
Use ONLY the project's own design tokens and theme system discovered in Step 2. NEVER use hardcoded colors, raw hex values, or default framework utility colors. Match the existing codebase's styling conventions exactly.

## Design Rules
- Realistic content (real names, dates, numbers) — never placeholder text
- Clear visual hierarchy with consistent spacing using the project's spacing scale
- Generous whitespace, responsive layouts

## Previous Conversation
${history || "None"}
${baseContext}
${personaContext}

## User Request
${message}

## Output
${buildDesignSystemPrompt(numDesigns)}${customInstructionsBlock}${buildRootDirectoryInstruction(rootDirectory)}`;
}

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
  devPort?: number,
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
3. Leave the deliverable files on disk when you finish the turn. Eva uploads them to Convex storage and renders them in chat with the video player (speed controls). Do not paste a URL instead.
4. Never use \`create_artifact\` (or any /artifacts/… link) for these captures — artifacts are for HTML docs, not session walkthrough media.
5. Never use \`pkill -f\`, \`pgrep -f\`, \`killall\`, or another broad command-line match to clean up ffmpeg, Chrome, or recording processes. The recording instructions are present in the parent agent's command line, so a broad match can terminate this turn. Stop recordings with \`agent-browser record stop\`. If you manually start a process, capture its exact PID when launching it and only stop that PID.
6. For "each" or "all features" requests, first make a checklist naming every feature, then create one isolated deliverable per checklist item unless the user asks for a combined walkthrough. Do not finish until every checklist item has a non-empty file in the deliverable folder.
7. A status update such as "recording now" is not a final answer. Finish the captures before replying, then list which attached file demonstrates each feature. If capture is impossible, report the concrete failure instead of promising future work.
8. To embed a capture in a PR comment or Linear issue (GitHub/Linear cannot see chat attachments): eva MCP \`upload_media\` → curl the file to the returned uploadUrl → \`get_media_url\` for a permanent public link.`;
  return `${message}${planContext}${proofSection}${devServerSection}${browserSection}

Eva session (${repo.owner}/${repo.name}, branch "${branchName}"):
- Do all work on "${branchName}". Never commit or push to main. Fetching/merging/rebasing/pulling from main into this branch is allowed when the user asks.
- If you change code: \`git add -A -- ':!*.png' ... ':!recordings/' && git diff --cached --quiet || git commit -m "task: ${commitMessage}"\`
- Duplicate/extract PR (when the user asks to ship this session's work as a separate PR that merges independently): never push this branch's commits to another ref — identical SHAs make GitHub auto-merge this session's PR. Instead squash onto a fresh branch: \`git fetch origin && git checkout -b eva/dup-<short-slug> origin/${baseBranch} && git merge --squash ${branchName} && git commit -m "<summary>" && git push -u origin HEAD && gh pr create --fill --base ${baseBranch} && git checkout ${branchName}\`. Base on "${baseBranch}" unless the user names a different base branch. Resolve squash conflicts if any. After that PR merges, merge the base branch into ${branchName} before continuing.
- Questions only: answer without unnecessary edits. No build/lint/test unless asked.
- Never commit images/video. Minimal changes.${getResponseLengthInstruction("edit")}${customInstructionsBlock}${buildSystemPromptBlock(systemPrompt)}${buildRootDirectoryInstruction(rootDirectory)}`;
}
