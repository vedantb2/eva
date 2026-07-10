/** How the sandbox daemon should run this turn. */
export type SessionTurnKind = "conversational" | "agent";

const CODE_TASK_PATTERN =
  /\b(implement|refactor|fix|add|create|update|delete|remove|build|change|modify|commit|push|wire|hook|migrate|debug|rename|extract)\b/i;

const CODE_CONTEXT_PATTERN =
  /\b(apps\/|packages\/|\.tsx?\b|\.jsx?\b|src\/|convex\/|glob\b|grep\b|file tree|codebase)\b/i;

/** Tool/MCP/platform actions need the full agent daemon (MCP config + coding tools). */
const TOOL_OR_MCP_PATTERN =
  /\b(mcp|eva\s+mcp|convex\s+query|test\s+query|query\s+(?:the\s+)?(?:project|database|db|convex)|run\s+(?:a\s+)?(?:test\s+)?query|use\s+(?:the\s+)?eva)\b/i;

const CONVERSATIONAL_PREFIX_PATTERN =
  /^(hi|hey|hello|sup|thanks|thank you|what is|what's|how many|how much|who is|when is|where is|loop latency test)/i;

const MATH_PATTERN = /^\s*\d+\s*[\+\-\*\/]\s*\d+/;
const MATH_QUESTION_PATTERN =
  /^(what is|what's|how much is|calculate|compute)\s+\d+\s*[\+\-\*\/]\s*\d+/i;

/**
 * Classifies a user message for the Agent SDK daemon. Conversational turns use a
 * fresh one-shot query (no resume, no tools) so simple Q&A matches claude.ai
 * latency instead of paying for full coding-agent context on every message.
 */
export function classifyTurnKind(message: string): SessionTurnKind {
  const trimmed = message.trim();
  if (trimmed.length === 0) return "agent";
  if (trimmed.length > 500) return "agent";
  if (CODE_TASK_PATTERN.test(trimmed)) return "agent";
  if (CODE_CONTEXT_PATTERN.test(trimmed)) return "agent";
  if (TOOL_OR_MCP_PATTERN.test(trimmed)) return "agent";
  if (MATH_PATTERN.test(trimmed)) return "conversational";
  if (MATH_QUESTION_PATTERN.test(trimmed)) return "conversational";
  if (CONVERSATIONAL_PREFIX_PATTERN.test(trimmed)) return "conversational";
  // NOTE: no blanket "ends in ?" rule. A short question is not safe to run as a
  // conversational turn — those use a fresh, stateless query with no resume and
  // no tools, so a context-dependent follow-up ("why did you do that?", "can you
  // explain that again?") would answer with none of the prior turn's context.
  // Only the explicit self-contained patterns above take the fast path; anything
  // else runs as a full agent turn that keeps the session's context.
  return "agent";
}
