import { inngest } from "../client";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import {
  WORKSPACE_DIR,
  getGitHubToken,
  runClaudeCLIStreaming,
  extractJsonFromText,
  getOrCreateSandbox,
} from "../sandbox";

interface PreviousAnswer {
  question: string;
  answer: string;
}

const INTERVIEW_PROMPT = `You are a product manager conducting a PRD interview. You're talking to a non-technical stakeholder — use plain, business-friendly language only. You have access to the product's codebase to understand what already exists.

## Before You Ask
Explore the codebase (Read CLAUDE.md, browse files) to understand what the product already does. Use this context to ask smarter questions — but NEVER mention code, files, components, APIs, databases, or anything technical in your questions.

## Your Role
- Help the user define WHAT the feature should do from a user's perspective
- Ask about: who uses it, what they see, what happens when things go wrong, who has access, what the ideal experience looks like
- Reference existing product behavior the user would recognize (e.g. "the current dashboard", "the settings page") — NOT code or technical details
- Keep questions concise — a brief "e.g." is fine but don't write a whole paragraph

## Rules
- Use everyday language a business person would understand
- NEVER mention: APIs, databases, schemas, components, endpoints, state management, frontend/backend, migrations, or any developer concepts
- Focus on: user experience, business rules, permissions, notifications, edge cases, and what success looks like
- Do NOT repeat topics already covered
- Question: 1-2 short sentences. Be direct. A brief "e.g." clause is fine but keep the whole question under 30 words
- Options: 2-4 options. Label: 5-10 words. Description: ONE short sentence (under 20 words) — no multi-line explanations

## Readiness
After 3-6 questions (when you have enough to write a description, acceptance criteria, and user journeys), output {"ready": true}.

## Output Format
You MUST output ONLY valid JSON:
{"question": "your question", "options": [{"label": "Short name", "description": "Explanation"}]}
OR
{"ready": true}`;

const GENERATE_PROMPT = `You are a product manager writing a PRD from interview answers. Read CLAUDE.md and explore the codebase to understand existing product behavior, but write everything in plain business language.

## Output Format
You MUST output ONLY valid JSON with this exact structure:
{
  "description": "1-3 sentence description of what this feature does for the user",
  "requirements": ["Acceptance criterion 1", "Acceptance criterion 2"],
  "userFlows": [{"name": "Flow name", "steps": ["Step 1", "Step 2"]}]
}

## Guidelines
- Description: plain-English summary of what the user can do and why it matters
- Requirements: 5-15 acceptance criteria written as "The user can..." or "The system should..." statements. Each must be verifiable by a non-technical person just by using the product
- User flows: 2-5 step-by-step journeys written from the user's perspective (e.g. "User clicks the 'Create' button", "User sees a confirmation message"). 3-8 steps each
- NEVER use technical language — no mention of APIs, databases, components, or code`;

function buildQuestionPrompt(
  docTitle: string,
  previousAnswers: PreviousAnswer[],
): string {
  let prompt = `## Document: "${docTitle}"\n\n`;

  if (previousAnswers.length > 0) {
    prompt += `## Already Decided\n`;
    previousAnswers.forEach((a, i) => {
      prompt += `${i + 1}. ${a.question} → ${a.answer}\n`;
    });
    prompt += "\n";
  }

  prompt += `## Your Task
Ask ONE question about this feature from a product perspective — who uses it, what they experience, what happens in edge cases, or what success looks like.

If you have enough information (typically after 3-6 questions), output {"ready": true} instead.

Output ONLY valid JSON:
{"question": "your question", "options": [{"label": "Short name", "description": "Explanation"}]}
OR
{"ready": true}`;

  return prompt;
}

export const docInterview = inngest.createFunction(
  {
    id: "doc-interview",
    retries: 2,
    onFailure: async ({ event }) => {
      const { clerkToken, docId } = event.data.event.data;
      const convex = createConvex(clerkToken);
      await convex.mutation(api.docs.updateLastInterviewMessage, {
        id: docId as Id<"docs">,
        content: JSON.stringify({ error: true }),
      });
    },
  },
  { event: "docs/interview.question" },
  async ({ event, step }) => {
    const {
      clerkToken,
      docId,
      repoId,
      installationId,
      docTitle,
      previousAnswers = [],
    } = event.data;
    const convex = createConvex(clerkToken);

    const { doc, repo } = await step.run("fetch-data", async () => {
      const docData = await convex.query(api.docs.get, {
        id: docId as Id<"docs">,
      });
      const repoData = await convex.query(api.githubRepos.get, {
        id: repoId as Id<"githubRepos">,
      });
      if (!docData || !repoData) throw new Error("Doc or repo not found");
      return { doc: docData, repo: repoData };
    });

    const questionResult = await step.run("generate-question", async () => {
      const githubToken = await getGitHubToken(installationId);

      const sandbox = await getOrCreateSandbox(
        doc.sandboxId ?? undefined,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.docs.updateDocSandbox, {
            id: docId as Id<"docs">,
            sandboxId,
          });
        },
      );

      const prompt = buildQuestionPrompt(
        docTitle,
        previousAnswers as PreviousAnswer[],
      );

      const fullPrompt = `${INTERVIEW_PROMPT} ${prompt}`;

      await convex.mutation(api.docs.addInterviewMessage, {
        id: docId as Id<"docs">,
        role: "assistant",
        content: "",
        activityLog: "",
      });

      const claudeResult = await runClaudeCLIStreaming(sandbox, fullPrompt, {
        model: "sonnet",
        allowedTools: ["Read", "Glob", "Grep"],
        workDir: WORKSPACE_DIR,
        timeout: 120,
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: docId,
            currentActivity,
          });
        },
      });

      const jsonStr = extractJsonFromText(claudeResult.result);
      if (!jsonStr) {
        throw new Error(
          `Failed to extract JSON: ${claudeResult.result.slice(0, 500)}`,
        );
      }

      return { jsonStr, activityLog: claudeResult.activityLog };
    });

    const parsed = JSON.parse(questionResult.jsonStr);
    const isReady = parsed.ready === true;

    if (isReady) {
      const generateResult = await step.run("generate-content", async () => {
        const githubToken = await getGitHubToken(installationId);
        const sandbox = await getOrCreateSandbox(
          doc.sandboxId ?? undefined,
          githubToken,
          repo.owner,
          repo.name,
          async (sandboxId) => {
            await convex.mutation(api.docs.updateDocSandbox, {
              id: docId as Id<"docs">,
              sandboxId,
            });
          },
        );

        const answersText = (previousAnswers as PreviousAnswer[])
          .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
          .join("\n\n");

        const prompt = `Feature: "${docTitle}"

Interview answers:
${answersText}

Generate a product description, acceptance criteria, and user journeys for this feature. Write everything from the user's perspective in plain language.

Output ONLY valid JSON.`;

        const fullPrompt = `${GENERATE_PROMPT}\n\n${prompt}`;

        await convex.mutation(api.docs.addInterviewMessage, {
          id: docId as Id<"docs">,
          role: "assistant",
          content: "",
          activityLog: "",
        });

        const claudeResult = await runClaudeCLIStreaming(sandbox, fullPrompt, {
          model: "sonnet",
          allowedTools: ["Read", "Glob", "Grep"],
          workDir: WORKSPACE_DIR,
          timeout: 180,
          onOutput: async (currentActivity) => {
            await convex.mutation(api.streaming.set, {
              entityId: docId,
              currentActivity,
            });
          },
        });

        const jsonStr = extractJsonFromText(claudeResult.result);
        if (!jsonStr) {
          throw new Error(
            `Failed to extract JSON: ${claudeResult.result.slice(0, 500)}`,
          );
        }

        return { jsonStr, activityLog: claudeResult.activityLog };
      });

      await step.run("save-generated-content", async () => {
        await convex.mutation(api.streaming.clear, { entityId: docId });

        const generated = JSON.parse(generateResult.jsonStr);

        await convex.mutation(api.docs.update, {
          id: docId as Id<"docs">,
          description: generated.description,
          requirements: generated.requirements,
          userFlows: generated.userFlows,
        });

        await convex.mutation(api.docs.updateLastInterviewMessage, {
          id: docId as Id<"docs">,
          content: generateResult.jsonStr,
          activityLog: generateResult.activityLog || undefined,
        });
      });

      return { success: true, type: "generated" };
    }

    await step.run("save-message", async () => {
      await convex.mutation(api.streaming.clear, { entityId: docId });
      await convex.mutation(api.docs.updateLastInterviewMessage, {
        id: docId as Id<"docs">,
        content: questionResult.jsonStr,
        activityLog: questionResult.activityLog || undefined,
      });
    });

    return {
      success: true,
      type: "question",
      question: questionResult.jsonStr,
    };
  },
);
