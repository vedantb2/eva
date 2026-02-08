import { ensureSandbox, getGitHubToken, runClaudeCLI } from "./sandbox.js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RepoContext {
  owner: string;
  name: string;
  installationId: number;
}

const conversationHistories = new Map<string, Message[]>();
const sandboxIds = new Map<string, string>();

function getHistory(conversationId: string): Message[] {
  return conversationHistories.get(conversationId) ?? [];
}

function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
) {
  const history = getHistory(conversationId);
  history.push({ role, content });
  if (history.length > 20) history.splice(0, history.length - 20);
  conversationHistories.set(conversationId, history);
}

export async function askQuestion(
  conversationId: string,
  question: string,
  repo: RepoContext,
): Promise<string> {
  addMessage(conversationId, "user", question);

  const token = await getGitHubToken(repo.installationId);
  const existingSandboxId = sandboxIds.get(conversationId);
  const sandbox = await ensureSandbox(
    existingSandboxId,
    token,
    repo.owner,
    repo.name,
  );
  sandboxIds.set(conversationId, sandbox.id);

  const recentHistory = getHistory(conversationId)
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are answering questions about a codebase for a non-technical user. This is READ-ONLY mode.

Repository: ${repo.owner}/${repo.name}

Previous conversation:
${recentHistory || "None"}

Question: ${question}

How to find information:
- Use Glob to find files
- Use Grep to search for patterns
- Use Read to examine files

CRITICAL response rules:
- Keep your answer SHORT (2-4 sentences max)
- Use PLAIN TEXT only, no markdown formatting, no headers, no bullet points, no code blocks
- Write for someone who does NOT know programming - avoid technical jargon
- If you must mention a file, just say the filename without the full path
- Be direct and answer the question simply
- DO NOT modify any files`;

  const result = await runClaudeCLI(sandbox, prompt, {
    model: "opus",
    allowedTools: ["Read", "Glob", "Grep"],
  });

  const answer = result.result || "I couldn't find an answer to your question.";
  addMessage(conversationId, "assistant", answer);
  return answer;
}
