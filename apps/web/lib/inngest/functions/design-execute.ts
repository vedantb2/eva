import { inngest } from "../client";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import {
  getSandbox,
  getGitHubToken,
  getOrCreateSandbox,
  runClaudeCLIStreaming,
  extractJsonFromText,
} from "../sandbox";
import {
  buildDesignPrompt,
  DESIGN_SYSTEM_PROMPT,
} from "@/lib/prompts/designPrompts";

export const designExecute = inngest.createFunction(
  {
    id: "design-execute",
    retries: 2,
    cancelOn: [
      { event: "design/execute.cancel", match: "data.designSessionId" },
    ],
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; designSessionId: string } };
      };
      const convex = createConvex(eventData.event.data.clerkToken);
      const id = eventData.event.data.designSessionId as Id<"designSessions">;
      await convex.mutation(api.designSessions.addMessage, {
        id,
        role: "assistant",
        content: `Error: ${error.message}`,
      });
    },
  },
  { event: "design/execute" },
  async ({ event, step }) => {
    const { clerkToken, designSessionId, message } = event.data;
    const convex = createConvex(clerkToken);

    const { session, repo, installationId } = await step.run(
      "fetch-session-data",
      async () => {
        const sessionData = await convex.query(api.designSessions.get, {
          id: designSessionId as Id<"designSessions">,
        });
        if (!sessionData) throw new Error("Design session not found");
        const repoData = await convex.query(api.githubRepos.get, {
          id: sessionData.repoId,
        });
        if (!repoData) throw new Error("Repository not found");
        return {
          session: sessionData,
          repo: repoData,
          installationId: repoData.installationId,
        };
      },
    );

    const sandboxData = await step.run("setup-sandbox", async () => {
      const githubToken = await getGitHubToken(installationId);
      const sandbox = await getOrCreateSandbox(
        session.sandboxId,
        githubToken,
        repo.owner,
        repo.name,
        async (sandboxId) => {
          await convex.mutation(api.designSessions.updateSandbox, {
            id: designSessionId as Id<"designSessions">,
            sandboxId,
          });
        },
      );
      return { sandboxId: sandbox.id };
    });

    const result = await step.run("generate-designs", async () => {
      const sandbox = await getSandbox(sandboxData.sandboxId);

      let selectedBase = null;
      if (session.selectedVariationIndex !== undefined) {
        const lastAssistant = [...session.messages]
          .reverse()
          .find((m) => m.role === "assistant" && m.variations?.length);
        if (lastAssistant?.variations) {
          selectedBase =
            lastAssistant.variations[session.selectedVariationIndex] ?? null;
        }
      }

      const prompt = buildDesignPrompt(
        repo,
        message,
        session.messages,
        selectedBase,
      );

      await convex.mutation(api.designSessions.addMessage, {
        id: designSessionId as Id<"designSessions">,
        role: "assistant",
        content: "",
        activityLog: "",
      });

      const claudeResult = await runClaudeCLIStreaming(sandbox, prompt, {
        model: "opus",
        allowedTools: ["Read", "Glob", "Grep", "Skill"],
        appendSystemPrompt: DESIGN_SYSTEM_PROMPT,
        onOutput: async (currentActivity) => {
          await convex.mutation(api.streaming.set, {
            entityId: designSessionId,
            currentActivity,
          });
        },
      });

      return {
        result: claudeResult.result,
        activityLog: claudeResult.activityLog,
      };
    });

    await step.run("save-result", async () => {
      await convex.mutation(api.streaming.clear, {
        entityId: designSessionId,
      });

      const jsonStr = extractJsonFromText(result.result || "");
      if (jsonStr) {
        const parsed: {
          summary?: string;
          variations?: Array<{ label: string; code: string }>;
        } = JSON.parse(jsonStr);
        await convex.mutation(api.designSessions.updateLastMessage, {
          id: designSessionId as Id<"designSessions">,
          content: parsed.summary || "Here are 3 design variations:",
          activityLog: result.activityLog || undefined,
          variations: parsed.variations?.map((v) => ({
            label: v.label,
            code: v.code,
          })),
        });
      } else {
        await convex.mutation(api.designSessions.updateLastMessage, {
          id: designSessionId as Id<"designSessions">,
          content: result.result || "Failed to generate designs.",
          activityLog: result.activityLog || undefined,
        });
      }
    });

    return { success: true };
  },
);
