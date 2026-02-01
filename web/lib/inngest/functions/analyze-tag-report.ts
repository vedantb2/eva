import { inngest } from "../client";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { serverEnv } from "@/env/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildAnalyzeTagReportPrompt } from "@/lib/prompts/analyzeTagReportPrompt";
import { extractJsonFromResponse, normalizeAiInsights } from "../normalizeAiInsights";
import type { AiInsights } from "../normalizeAiInsights";

export const analyzeTagReport = inngest.createFunction(
  {
    id: "analyze-tag-report",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const eventData = event.data as unknown as {
        event: { data: { clerkToken: string; reportId: string } };
      };
      const { clerkToken, reportId } = eventData.event.data;
      if (!reportId) return;
      const convex = createConvex(clerkToken);
      await convex.mutation(api.reports.failReportAnalysis, {
        id: reportId as Id<"reports">,
        error: error.message,
      });
    },
  },
  { event: "report/analyze.requested" },
  async ({ event, step }) => {
    const { clerkToken, reportId, repoId, tagId, tagIds } = event.data;
    const convex = createConvex(clerkToken);

    // Determine effective tags (multi-tag support)
    const effectiveTagIds: string[] =
      tagIds && Array.isArray(tagIds) && tagIds.length > 0 ? tagIds : [tagId];

    // Step 1: Update report status to analyzing
    await step.run("update-status-analyzing", async () => {
      await convex.mutation(api.reports.updateReportStatus, {
        id: reportId as Id<"reports">,
        status: "analyzing",
      });
    });

    // Step 2: Collect all work data for the tag(s)
    const workData = await step.run("collect-work-data", async () => {
      // Fetch tasks and sessions by tag(s) - use multi-tag query when applicable
      const workItems = effectiveTagIds.length > 1
        ? await convex.query(api.reports.getWorkItemsByTags, {
            repoId: repoId as Id<"githubRepos">,
            tagIds: effectiveTagIds,
            includeDeleted: true,
          })
        : await convex.query(api.reports.getWorkItemsByTag, {
            repoId: repoId as Id<"githubRepos">,
            tagId: effectiveTagIds[0],
            includeDeleted: true,
          });

      // Fetch full task details with descriptions
      const tasks: Array<{
        id: string;
        title: string;
        description?: string;
        status: string;
        createdAt: number;
        updatedAt: number;
        tags?: string[];
      }> = [];

      for (const task of workItems.tasks) {
        const fullTask = await convex.query(api.agentTasks.get, {
          id: task._id as Id<"agentTasks">,
        });
        if (fullTask) {
          tasks.push({
            id: fullTask._id,
            title: fullTask.title,
            description: fullTask.description,
            status: fullTask.status,
            createdAt: fullTask.createdAt,
            updatedAt: fullTask.updatedAt,
            tags: fullTask.tags,
          });
        }
      }

      // Fetch runs for each task
      const runs: Array<{
        taskTitle: string;
        status: string;
        resultSummary?: string;
        errorLogs: string[];
        error?: string;
        startedAt?: number;
      }> = [];

      for (const task of workItems.tasks) {
        const taskRuns = await convex.query(api.agentRuns.listByTask, {
          taskId: task._id as Id<"agentTasks">,
        });
        for (const run of taskRuns) {
          runs.push({
            taskTitle: task.title,
            status: run.status,
            resultSummary: run.resultSummary,
            errorLogs: run.logs
              .filter((l: { level: string }) => l.level === "error")
              .map((l: { message: string }) => l.message),
            error: run.error,
            startedAt: run.startedAt,
          });
        }
      }

      // Fetch session details with messages
      const sessions: Array<{
        title: string;
        status: string;
        messageCount: number;
        createdAt: number;
        messages: Array<{ role: string; content: string }>;
        tags?: string[];
      }> = [];

      for (const session of workItems.sessions) {
        const fullSession = await convex.query(api.sessions.get, {
          id: session._id as Id<"sessions">,
        });
        if (fullSession) {
          sessions.push({
            title: fullSession.title,
            status: fullSession.status,
            messageCount: fullSession.messages.length,
            createdAt: fullSession._creationTime,
            messages: fullSession.messages.map(
              (m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content,
              })
            ),
            tags: fullSession.tags,
          });
        }
      }

      return { tasks, runs, sessions };
    });

    // Step 3: Call Claude API for pattern analysis
    const aiInsights = await step.run("analyze-with-claude", async () => {
      const prompt = buildAnalyzeTagReportPrompt({
        tagId: effectiveTagIds.length > 1
          ? effectiveTagIds.join(", ")
          : tagId,
        tasks: workData.tasks,
        runs: workData.runs,
        sessions: workData.sessions,
      });

      const client = new Anthropic({
        apiKey: serverEnv.ANTHROPIC_API_KEY,
      });

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = message.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }

      const responseText = textContent.text;

      // Extract JSON from response and normalize
      const jsonStr = extractJsonFromResponse(responseText);
      const parsed: Partial<AiInsights> = JSON.parse(jsonStr);
      return normalizeAiInsights(parsed) satisfies AiInsights;
    });

    // Step 4: Save AI insights to the report
    await step.run("save-ai-insights", async () => {
      await convex.mutation(api.reports.completeReportAnalysis, {
        id: reportId as Id<"reports">,
        aiInsights,
      });
    });

    return { success: true, reportId };
  }
);
