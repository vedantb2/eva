import {
  buildRootDirectoryInstruction,
  buildSystemPromptBlock,
  getResponseLengthInstruction,
} from "../prompts";

interface BuildAgentTaskChatPromptArgs {
  repoOwner: string;
  repoName: string;
  title: string;
  description: string | undefined;
  tags: string[] | undefined;
  taskNumber: number | undefined;
  status: string;
  message: string;
  rootDirectory: string;
  customInstructionsBlock: string;
  systemPrompt: string | undefined;
}

/**
 * Builds the prompt for an in-sandbox chat message attached to an agent task.
 * The agent runs against the task's existing sandbox (same one used by the
 * task's main run) and may explore or edit code, but never commits or pushes.
 */
export function buildAgentTaskChatPrompt(
  args: BuildAgentTaskChatPromptArgs,
): string {
  const numberLabel = args.taskNumber ? `#${args.taskNumber} ` : "";
  const descriptionBlock = args.description
    ? `\nTask description:\n${args.description}`
    : "";
  const tagsLine =
    args.tags && args.tags.length > 0 ? `\nTags: ${args.tags.join(", ")}` : "";

  return `You're in the active sandbox for task ${numberLabel}"${args.title}" on ${args.repoOwner}/${args.repoName}.
Status: ${args.status}${tagsLine}${descriptionBlock}

User: ${args.message}

You have full read/write access. Make the changes the user asks for, but DO NOT commit or push — leave any edits as working-tree changes. Eva publishes branches through the regular task workflow.

Steps:
1. Read CLAUDE.md if it exists
2. Find relevant files with Glob, Grep, Read
3. If the user asked for changes, make them with Edit or Write
4. Respond with the business outcome, no code/paths/jargon

Rules:
- If the user is asking a question, answer it — don't make unnecessary changes
- Never commit, push, or open PRs
- Never run build/lint/test/dev commands unless the user asks
- Minimal, focused changes${getResponseLengthInstruction("edit")}${args.customInstructionsBlock}${buildSystemPromptBlock(args.systemPrompt)}${buildRootDirectoryInstruction(args.rootDirectory)}`;
}
