import {
  buildRootDirectoryInstruction,
  buildSystemPromptBlock,
  getResponseLengthInstruction,
} from "../prompts";

interface BuildProjectChatPromptArgs {
  repoOwner: string;
  repoName: string;
  title: string;
  description: string | undefined;
  branchName: string | undefined;
  generatedSpec: string | undefined;
  message: string;
  responseLength: string;
  rootDirectory: string;
  customInstructionsBlock: string;
  systemPrompt: string | undefined;
}

/**
 * Builds the prompt for an in-sandbox chat message attached to a project. The
 * agent runs against the project's existing sandbox/branch and can edit code,
 * but it never commits or pushes — chat is conversational + exploratory, and
 * the regular project workflow owns publishing.
 */
export function buildProjectChatPrompt(
  args: BuildProjectChatPromptArgs,
): string {
  const branchLine = args.branchName
    ? `Project branch: "${args.branchName}"`
    : "Project branch: not yet assigned";
  const descriptionBlock = args.description
    ? `\nProject description:\n${args.description}`
    : "";
  const specBlock = args.generatedSpec
    ? `\n\nApproved spec:\n${args.generatedSpec}`
    : "";

  return `You're in the active sandbox for project "${args.title}" on ${args.repoOwner}/${args.repoName}.
${branchLine}${descriptionBlock}${specBlock}

User: ${args.message}

You have full read/write access. Make the changes the user asks for, but DO NOT commit or push — leave any edits as working-tree changes. Eva publishes branches through the regular project workflow.

Steps:
1. Read CLAUDE.md if it exists
2. Find relevant files with Glob, Grep, Read
3. If the user asked for changes, make them with Edit or Write
4. Respond with the business outcome, no code/paths/jargon

Rules:
- If the user is asking a question, answer it — don't make unnecessary changes
- Never commit, push, or open PRs
- Never run build/lint/test/dev commands unless the user asks
- Minimal, focused changes${getResponseLengthInstruction(args.responseLength, "edit")}${args.customInstructionsBlock}${buildSystemPromptBlock(args.systemPrompt)}${buildRootDirectoryInstruction(args.rootDirectory)}`;
}
