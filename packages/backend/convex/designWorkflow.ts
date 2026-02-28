import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { LlmJson } from "@solvers-hub/llm-json";

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

const DESIGN_SYSTEM_PROMPT = `You MUST write 3 React component variation files and commit them, then output ONLY valid JSON:
{
  "summary": "Brief design decisions",
  "variations": [
    { "label": "Design A - [descriptor]", "route": "/design-preview?v=a", "filePath": "[path you wrote]" },
    { "label": "Design B - [descriptor]", "route": "/design-preview?v=b", "filePath": "[path you wrote]" },
    { "label": "Design C - [descriptor]", "route": "/design-preview?v=c", "filePath": "[path you wrote]" }
  ]
}

Rules for each variation file:
- Write to app/design-preview/variations/variation-a.tsx, variation-b.tsx, variation-c.tsx
- Single React component with \`export default function VariationA() { ... }\` (or B/C)
- ALWAYS import React hooks from 'react' — do NOT use React.useState or React.useEffect
- Use semantic Tailwind utilities (bg-primary, text-foreground, rounded-lg, etc.) — NEVER raw colors (no bg-slate-500, no text-gray-700)
- Every clickable element and section header MUST include a @tabler/icons-react icon
- Use realistic content (real names, dates, numbers) — never "Lorem ipsum", "Item 1", or "User 1"
- Add real interactivity: useState for toggles/modals/tabs, onClick handlers, form inputs
- Add hover feedback on ALL interactive elements and smooth transitions
- Add focus rings for accessibility
- Follow ALL guidelines loaded from skills — prioritize distinctive design, domain-grounded choices, and WCAG accessibility
- After writing all files, commit with a descriptive message and push
- Output ONLY the JSON, no other text`;

function buildDesignPrompt(
  repo: { owner: string; name: string },
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  selectedBase: { label: string; filePath: string } | null,
  persona: { name: string; prompt: string } | null,
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
1. Invoke the /frontend-design skill to load design quality guidelines
2. Invoke the /interface-design skill to load craft-focused design principles
3. Invoke the /web-design-guidelines skill to load accessibility guidelines
4. Read CLAUDE.md to understand the project
5. Read the Tailwind config and globals.css to understand the design tokens
6. Read existing components to understand STYLE PATTERNS (spacing, layout, visual language)
7. Check if app/design-preview/page.tsx exists. If not, create the router scaffold:
   - Create app/design-preview/page.tsx that lazy-imports variations/variation-{a,b,c}.tsx based on ?v= query param
   - Create app/design-preview/variations/ directory
8. Write 3 variation files to app/design-preview/variations/variation-a.tsx, variation-b.tsx, variation-c.tsx
9. Commit all changes with message: "design: ${message.slice(0, 60)}"
10. Push to the current branch
11. Output ONLY the JSON

## Router Scaffold (create if app/design-preview/page.tsx doesn't exist)
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
  return <Suspense fallback={<div className="flex items-center justify-center h-screen"><p>Loading...</p></div>}><Component /></Suspense>;
}
\`\`\`

## Variation Strategies
- Design A: Clean/conventional — prioritize clarity, familiar patterns, and straightforward navigation
- Design B: Creative/bold — unconventional layout, striking visual hierarchy, or unique interaction patterns
- Design C: Compact/efficient — high information density, minimal chrome, space-efficient UI

## Design System
The project uses a custom Tailwind config with CSS variables. Use the project's actual design tokens:

**Colors:** bg-background, bg-foreground, bg-primary, bg-secondary, bg-muted, bg-accent, bg-card, bg-destructive, bg-success, bg-warning (and text-* equivalents, plus text-primary-foreground etc.)
**Border:** border-border, border-input
**Radius:** rounded-sm (6px), rounded-md (8px), rounded-lg (10px)
**Font:** font-sans (Inter is loaded automatically)

CRITICAL: Use ONLY these semantic color utilities. NEVER use raw Tailwind colors like bg-slate-500, text-gray-700, bg-zinc-600. Always use bg-primary, text-muted-foreground, etc.

## Design Quality Guidelines
- Use realistic content (real names, dates, numbers) — never "Lorem ipsum", "Item 1", or "User 1"
- Clear visual hierarchy: one primary action per view, secondary actions de-emphasized
- Consistent spacing using multiples of 4px via Tailwind: p-2, p-4, p-6, p-8
- Group related elements with cards (bg-card rounded-lg border border-border) or bordered sections
- Use whitespace generously — don't crowd elements together
- Responsive-first: use max-w-* containers, flex/grid layouts

## Previous Conversation
${history || "None"}
${baseContext}
${personaContext}

## User Request
${message}

## Output
After completing all steps above, output ONLY valid JSON matching the format described in your system prompt. No other text.`;
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
    convexToken: v.string(),
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
        convexToken: args.convexToken,
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

    const prompt = buildDesignPrompt(
      { owner: repo.owner, name: repo.name },
      args.message,
      conversationHistory,
      selectedBase,
      persona,
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

    return null;
  },
});
