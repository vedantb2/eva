import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { getCurrentUserId } from "./auth";
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

// --- Prompt building (moved from apps/web/lib/prompts/designPrompts.ts) ---

const DESIGN_SYSTEM_PROMPT = `You MUST output ONLY valid JSON in this exact format — no other text, no markdown fences, no explanation:
{
  "summary": "Brief description of design decisions",
  "variations": [
    {
      "label": "Design A - [descriptor]",
      "code": "A single React component file. MUST start with: import { useState, useEffect } from 'react'; (import any hooks you need). Then: export default function App() { ... }. Use Tailwind classes for all styling."
    },
    { "label": "Design B - [descriptor]", "code": "..." },
    { "label": "Design C - [descriptor]", "code": "..." }
  ]
}

Rules for each variation:
- Single React component file starting with \`import { useState } from 'react';\` (add useEffect or other hooks as needed), then \`export default function App() { ... }\`
- ALWAYS import React hooks from 'react' — do NOT use React.useState or React.useEffect
- Use semantic Tailwind utilities (bg-primary, text-foreground, rounded-lg, etc.) — NEVER raw colors (no bg-slate-500, no text-gray-700)
- Every clickable element and section header MUST include a @tabler/icons-react icon
- Use realistic content (real names, dates, numbers) — never "Lorem ipsum", "Item 1", or "User 1"
- Add real interactivity: useState for toggles/modals/tabs, onClick handlers, form inputs
- Add hover feedback on ALL interactive elements and smooth transitions
- Add focus rings for accessibility
- Follow ALL guidelines loaded from skills — prioritize distinctive design, domain-grounded choices, and WCAG accessibility
- DO NOT modify any files in the codebase
- Output ONLY the JSON, no other text`;

function buildDesignPrompt(
  repo: { owner: string; name: string },
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  selectedBase: { label: string; code: string } | null,
  persona: { name: string; prompt: string } | null,
): string {
  const history = conversationHistory
    .filter((m) => m.content)
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const baseContext = selectedBase
    ? `\n\n## Selected Base Design
  The user selected "${selectedBase.label}" as the base. Here is its code:
  \`\`\`jsx
  ${selectedBase.code}
  \`\`\`
  IMPORTANT: Preserve the core layout structure, color choices, and interaction patterns from this base.
  Only change what the user explicitly requests. Generate 3 variations that are refinements of THIS
  design, not completely new approaches.`
    : "";

  const personaContext = persona
    ? `\n\n## Target Persona
Name: ${persona.name}
${persona.prompt}

Design with this persona in mind — consider their goals, context, and preferences.`
    : "";

  return `You are a UI/UX designer working on the ${repo.owner}/${repo.name} codebase.

## Your Task
Read the codebase to understand the existing design system, then generate 3 React component variations based on the user's request.

## Steps
1. Invoke the /frontend-design skill to load design quality guidelines
2. Invoke the /interface-design skill to load craft-focused design principles
3. Invoke the /web-design-guidelines skill to load accessibility guidelines
4. Read CLAUDE.md to understand the project
5. Read the Tailwind config and globals.css to understand the design tokens
6. Read existing components to understand STYLE PATTERNS (spacing, layout, visual language) — your output runs in isolation, so recreate patterns using plain JSX + Tailwind, no project imports
7. Generate 3 distinct, interactive React component variations following the loaded guidelines

## Variation Strategies
- Design A: Clean/conventional — prioritize clarity, familiar patterns, and straightforward navigation
- Design B: Creative/bold — unconventional layout, striking visual hierarchy, or unique interaction patterns
- Design C: Compact/efficient — high information density, minimal chrome, space-efficient UI

## Design System
The project uses a custom Tailwind config with CSS variables. Your components will be rendered in an environment that already provides these — just use the utility classes:

**Colors:** bg-background, bg-foreground, bg-primary, bg-secondary, bg-muted, bg-accent, bg-card, bg-destructive, bg-success, bg-warning (and text-* equivalents, plus text-primary-foreground etc.)
**Border:** border-border, border-input
**Radius:** rounded-sm (6px), rounded-md (8px), rounded-lg (10px)
**Font:** font-sans (Inter is loaded automatically)

CRITICAL: Use ONLY these semantic color utilities. NEVER use raw Tailwind colors like bg-slate-500, text-gray-700, bg-zinc-600. Always use bg-primary, text-muted-foreground, etc.

## Available Libraries
The preview environment has these pre-installed — use them freely:
- \`@tabler/icons-react\` — icons: \`import { IconSearch, IconSettings, IconBell, IconChevronDown, IconPlus, IconX, IconCheck, IconArrowRight, IconUser, IconMail, IconDots, IconFilter, IconCalendar, IconStar, IconTrash, IconPencil, IconEye, IconDownload, IconUpload, IconCopy, IconExternalLink, IconChartBar, IconActivity, IconClock, IconAlertTriangle, IconInfoCircle, IconChevronRight, IconLayoutKanban, IconSparkles } from "@tabler/icons-react"\`. Use icons on every button, nav item, section header, and list item.
- \`recharts\` — data visualization: \`import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"\`. Use for any metrics, analytics, or data display. Generate realistic data arrays.
- \`framer-motion\` — animations: \`import { motion, AnimatePresence } from "framer-motion"\`. Use \`<motion.div>\` for page transitions, staggered list reveals, hover scale effects, and layout animations. Makes everything feel polished.
- \`date-fns\` — date formatting: \`import { format, formatDistanceToNow, subDays, subHours } from "date-fns"\`. Use for realistic timestamps like "2 hours ago" or "Jan 15, 2026".
- \`clsx\` — conditional classes: \`import clsx from "clsx"\`. Use for toggling classes based on state.
- Only font: Inter (\`font-sans\`). Use weight variation (font-medium, font-semibold, font-bold) and size contrast for hierarchy.

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
    githubToken: v.string(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch session data and build prompt
    const sessionData = await step.runQuery(
      internal.designWorkflow.getSessionDataAndPrompt,
      {
        designSessionId: args.designSessionId,
        message: args.message,
        personaId: args.personaId,
      },
    );

    // Step 2: Setup sandbox + fire Claude CLI (with retry)
    await step.runAction(
      internal.daytona.setupAndExecuteDesign,
      {
        designSessionId: args.designSessionId,
        existingSandboxId: sessionData.sandboxId,
        githubToken: args.githubToken,
        repoOwner: sessionData.repoOwner,
        repoName: sessionData.repoName,
        prompt: sessionData.prompt,
        systemPrompt: DESIGN_SYSTEM_PROMPT,
        convexToken: args.convexToken,
        model: "opus",
        allowedTools: "Read,Glob,Grep,Skill",
      },
      { retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 } },
    );

    // Step 3: Wait for callback from sandbox
    const result = await step.awaitEvent(designCompleteEvent);

    // Step 4: Save results and clear workflow
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
    repoOwner: v.string(),
    repoName: v.string(),
    prompt: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session) throw new Error("Design session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    // Get persona if provided
    let persona: { name: string; prompt: string } | null = null;
    if (args.personaId) {
      const personaDoc = await ctx.db.get(args.personaId);
      if (personaDoc) {
        persona = { name: personaDoc.name, prompt: personaDoc.prompt };
      }
    }

    // Get selected base variation if user picked one
    let selectedBase: { label: string; code: string } | null = null;
    if (session.selectedVariationIndex !== undefined) {
      const lastAssistant = [...session.messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.variations?.length);
      if (lastAssistant?.variations) {
        const variation =
          lastAssistant.variations[session.selectedVariationIndex];
        if (variation) {
          selectedBase = { label: variation.label, code: variation.code };
        }
      }
    }

    // Build conversation history and prompt
    const conversationHistory = session.messages
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
      repoOwner: repo.owner,
      repoName: repo.name,
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
    // Clear streaming activity
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) =>
        q.eq("entityId", String(args.designSessionId)),
      )
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    const session = await ctx.db.get(args.designSessionId);
    if (!session) return null;

    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (!last) return null;

    if (args.success && args.result) {
      const jsonStr = extractJsonFromText(args.result);
      if (jsonStr) {
        const parsed: {
          summary?: string;
          variations?: Array<{ label: string; code: string }>;
        } = JSON.parse(jsonStr);
        last.content = parsed.summary || "Here are 3 design variations:";
        last.activityLog = args.activityLog || undefined;
        last.variations = parsed.variations?.map((variation) => ({
          label: variation.label,
          code: variation.code,
        }));
      } else {
        last.content = args.result || "Failed to generate designs.";
        last.activityLog = args.activityLog || undefined;
      }
    } else {
      last.content = `Error: ${args.error || "Unknown error during design generation."}`;
      last.activityLog = args.activityLog || undefined;
    }

    // Clear the active workflow
    await ctx.db.patch(args.designSessionId, {
      messages,
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Called by the sandbox via ConvexHttpClient (authenticated with Clerk JWT).
 * Sends the workflow event to signal completion.
 */
export const handleCompletion = mutation({
  args: {
    designSessionId: v.id("designSessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.designSessionId);
    if (!session || !session.activeWorkflowId) return null;
    if (session.userId !== userId) throw new Error("Not authorized");

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
