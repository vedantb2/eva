import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { LlmJson } from "@solvers-hub/llm-json";
import { buildRootDirectoryInstruction, DESIGN_SYSTEM_PROMPT } from "./prompts";

const designCompleteEvent = defineEvent({
  name: "designComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

const llmJson = new LlmJson({ attemptCorrection: true });

function buildDesignPrompt(
  repo: { owner: string; name: string },
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  selectedBase: { label: string; filePath: string } | null,
  persona: { name: string; prompt: string } | null,
  rootDirectory: string,
): string {
  const history = conversationHistory
    .filter((m) => m.content)
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const baseContext = selectedBase
    ? `\n\n## Selected Base Design
The user selected "${selectedBase.label}" as the base.
Read the file at: ${selectedBase.filePath}
IMPORTANT: Preserve the core layout structure, color choices, and interaction patterns from this base.
Only change what the user explicitly requests. Create 3 refined variations of THIS design.`
    : "";

  const personaContext = persona
    ? `\n\n## Target Persona
Name: ${persona.name}
${persona.prompt}

Design with this persona in mind — consider their goals, context, and preferences.`
    : "";

  return `You are a UI/UX designer working on the ${repo.owner}/${repo.name} codebase.

## Your Task
Read the codebase to understand the existing design system, then write 3 React component variation files based on the user's request.

## Steps
1. Invoke skills: /frontend-design, /interface-design, /web-design-guidelines
2. Discover the project's design system:
   - Read CLAUDE.md to understand the project
   - Search for styling config files (e.g. tailwind.config.*, globals.css, theme.ts, stitches.config.*, styled-components theme, CSS custom properties, etc.)
   - Read existing components to understand the styling approach, token naming, and visual patterns
   - Identify the CSS/styling framework in use and its semantic tokens
3. Check if app/design-preview/page.tsx exists. If not, create the router scaffold below
4. Write 3 variation files to app/design-preview/variations/variation-{a,b,c}.tsx using ONLY the project's own design tokens
5. Commit: "design: ${message.slice(0, 60)}" and push
6. Output ONLY the JSON

## Router Scaffold (create if missing)
\`\`\`tsx
'use client';
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const variations: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  a: lazy(() => import('./variations/variation-a')),
  b: lazy(() => import('./variations/variation-b')),
  c: lazy(() => import('./variations/variation-c')),
};

export default function DesignPreview() {
  const params = useSearchParams();
  const v = params.get('v') || 'a';
  const Component = variations[v] || variations.a;
  return <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><p>Loading...</p></div>}><Component /></Suspense>;
}
\`\`\`

## Variation Strategies
- A: Clean/conventional — clarity, familiar patterns, straightforward navigation
- B: Creative/bold — unconventional layout, striking hierarchy, unique interactions
- C: Compact/efficient — high density, minimal chrome, space-efficient

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
After completing all steps, output ONLY valid JSON matching the format in your system prompt.${buildRootDirectoryInstruction(rootDirectory)}`;
}

function extractJsonFromText(text: string): string | null {
  const { json } = llmJson.extract(text);
  if (json.length === 0) return null;
  return JSON.stringify(json[0]);
}

// --- Workflow definition ---

export const designSessionWorkflow = workflow.define({
  args: {
    designSessionId: v.id("designSessions"),
    message: v.string(),
    personaId: v.optional(v.id("designPersonas")),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    const sessionData = await step.runQuery(
      internal.designWorkflow.getSessionDataAndPrompt,
      {
        designSessionId: args.designSessionId,
        message: args.message,
        personaId: args.personaId,
      },
    );

    if (!sessionData.sandboxId) {
      await step.runMutation(internal.designWorkflow.saveResult, {
        designSessionId: args.designSessionId,
        success: false,
        result: null,
        error: "Sandbox not running. Start the sandbox first.",
        activityLog: null,
      });
      return;
    }

    await step.runAction(
      internal.daytona.launchOnExistingSandbox,
      {
        sandboxId: sessionData.sandboxId,
        entityId: args.designSessionId,
        prompt: sessionData.prompt,
        userId: args.userId,
        completionMutation: "designWorkflow:handleCompletion",
        entityIdField: "designSessionId",
        model: "opus",
        allowedTools: "Read,Glob,Grep,Skill,Write,Edit,Bash",
        systemPrompt: DESIGN_SYSTEM_PROMPT,
        repoId: sessionData.repoId,
      },
      { retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 } },
    );

    const result = await step.awaitEvent(designCompleteEvent);

    await step.runMutation(internal.designWorkflow.saveResult, {
      designSessionId: args.designSessionId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
    });
  },
});

// --- Supporting internal functions ---

export const getSessionDataAndPrompt = internalQuery({
  args: {
    designSessionId: v.id("designSessions"),
    message: v.string(),
    personaId: v.optional(v.id("designPersonas")),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    branchName: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) throw new Error("Design session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    let persona: { name: string; prompt: string } | null = null;
    if (args.personaId) {
      const personaDoc = await ctx.db.get(args.personaId);
      if (personaDoc) {
        persona = { name: personaDoc.name, prompt: personaDoc.prompt };
      }
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.designSessionId))
      .collect();

    let selectedBase: { label: string; filePath: string } | null = null;
    if (session.selectedVariationIndex !== undefined) {
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.variations?.length);
      if (lastAssistant?.variations) {
        const variation =
          lastAssistant.variations[session.selectedVariationIndex];
        if (variation?.filePath) {
          selectedBase = {
            label: variation.label,
            filePath: variation.filePath,
          };
        }
      }
    }

    const conversationHistory = messages
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    const rootDirectory = repo.rootDirectory ?? "";

    const prompt = buildDesignPrompt(
      { owner: repo.owner, name: repo.name },
      args.message,
      conversationHistory,
      selectedBase,
      persona,
      rootDirectory,
    );

    return {
      sandboxId: session.sandboxId,
      branchName: session.branchName,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
    };
  },
});

export const saveResult = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) =>
        q.eq("entityId", String(args.designSessionId)),
      )
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.designSessionId))
      .order("desc")
      .first();
    if (!last) return null;

    if (args.success && args.result) {
      const jsonStr = extractJsonFromText(args.result);
      if (jsonStr) {
        const parsed: {
          summary?: string;
          variations?: Array<{
            label: string;
            route?: string;
            filePath?: string;
            code?: string;
          }>;
        } = JSON.parse(jsonStr);
        await ctx.db.patch(last._id, {
          content: parsed.summary || "Here are 3 design variations:",
          activityLog: args.activityLog || undefined,
          variations: parsed.variations?.map((variation) => ({
            label: variation.label,
            route: variation.route,
            filePath: variation.filePath,
          })),
        });
      } else {
        await ctx.db.patch(last._id, {
          content: args.result || "Failed to generate designs.",
          activityLog: args.activityLog || undefined,
        });
      }
    } else {
      await ctx.db.patch(last._id, {
        content: `Error: ${args.error || "Unknown error during design generation."}`,
        activityLog: args.activityLog || undefined,
      });
    }

    await ctx.db.patch(args.designSessionId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const handleCompletion = authMutation({
  args: {
    designSessionId: v.id("designSessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    costUsd: v.optional(v.number()),
    model: v.optional(v.string()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session || !session.activeWorkflowId) return null;
    if (session.userId !== ctx.userId) throw new Error("Not authorized");

    await workflow.sendEvent(ctx, {
      ...designCompleteEvent,
      workflowId: session.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    await ctx.db.insert("logs", {
      entityType: "designSession",
      entityId: String(args.designSessionId),
      entityTitle: session.title,
      costUsd: args.costUsd ?? 0,
      model: args.model ?? "sonnet",
      rawResultEvent: args.rawResultEvent,
      repoId: session.repoId,
      createdAt: Date.now(),
    });

    return null;
  },
});
