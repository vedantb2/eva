/** How the sandbox daemon should run this turn. */
export type SessionTurnKind = "conversational" | "agent";

const CODE_TASK_PATTERN =
  /\b(implement|refactor|fix|add|create|update|delete|remove|build|change|modify|commit|push|wire|hook|migrate|debug|rename|extract)\b/i;

const CODE_CONTEXT_PATTERN =
  /\b(apps\/|packages\/|\.tsx?\b|\.jsx?\b|src\/|convex\/|glob\b|grep\b|file tree|codebase)\b/i;

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
  if (MATH_PATTERN.test(trimmed)) return "conversational";
  if (MATH_QUESTION_PATTERN.test(trimmed)) return "conversational";
  if (CONVERSATIONAL_PREFIX_PATTERN.test(trimmed)) return "conversational";
  if (/\?\s*$/.test(trimmed) && trimmed.length < 220) {
    return "conversational";
  }
  return "agent";
}
