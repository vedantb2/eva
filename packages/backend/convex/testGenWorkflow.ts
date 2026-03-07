import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { workflowCompleteValidator } from "./validators";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";

const testGenCompleteEvent = defineEvent({
  name: "testGenComplete",
  validator: workflowCompleteValidator,
});

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return slug || "untitled";
}

function sanitizeCommitTitle(title: string): string {
  return title.replace(/"/g, "'").trim() || "document";
}

function formatRequirements(requirements: string[]): string {
  if (requirements.length === 0) {
    return "1. No explicit requirements provided. Infer coverage from the feature description and user flows.";
  }
  return requirements
    .map((requirement, i) => `${i + 1}. ${requirement}`)
    .join("\n");
}

function formatUserFlows(
  userFlows: Array<{ name: string; steps: string[] }>,
): string {
  if (userFlows.length === 0) {
    return "### Primary Flow\n1. No explicit user flows provided. Infer the main flow and key edge cases from the feature description.";
  }
  return userFlows
    .map((flow) => {
      const flowName = flow.name?.trim() || "Unnamed Flow";
      const steps =
        flow.steps.length > 0
          ? flow.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")
          : "1. No steps provided.";
      return `### ${flowName}\n${steps}`;
    })
    .join("\n\n");
}

// --- Workflow definition ---

export const testGenWorkflow = workflow.define({
  args: {
    docId: v.id("docs"),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch doc data, check if already completed
    const docData = await step.runQuery(internal.testGenWorkflow.getDocData, {
      docId: args.docId,
    });

    if (docData.alreadyCompleted) return;

    // Step 2: Set status to running
    await step.runMutation(internal.testGenWorkflow.setRunning, {
      docId: args.docId,
    });

    // Step 3: Setup ephemeral sandbox + fire test gen script
    // Uses branch, Write/Edit/Bash tools, and git push
    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: args.docId,
      installationId: args.installationId,
      repoOwner: docData.repoOwner,
      repoName: docData.repoName,
      prompt: docData.prompt,
      userId: args.userId,
      completionMutation: "testGenWorkflow:handleCompletion",
      entityIdField: "docId",
      model: "sonnet",
      allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
      ephemeral: true,
      branchName: docData.branchName,
      repoId: docData.repoId,
    });

    // Step 4: Wait for callback
    const result = await step.awaitEvent(testGenCompleteEvent);

    // Step 5: Create PR and save results
    await step.runMutation(internal.testGenWorkflow.saveResult, {
      docId: args.docId,
      success: result.success,
      result: result.result,
      error: result.error,
      branchName: docData.branchName,
    });
  },
});

// --- Supporting internal functions ---

export const getDocData = internalQuery({
  args: { docId: v.id("docs") },
  returns: v.object({
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
    branchName: v.string(),
    alreadyCompleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const repo = await ctx.db.get(doc.repoId);
    if (!repo) throw new Error("Repository not found");

    if (doc.testGenStatus === "completed" && doc.testPrUrl) {
      return {
        repoOwner: repo.owner,
        repoName: repo.name,
        repoId: doc.repoId,
        prompt: "",
        branchName: "",
        alreadyCompleted: true,
      };
    }

    const branchName = `tests/doc-${slugify(doc.title)}`;
    const commitTitle = sanitizeCommitTitle(doc.title);

    const prompt = `You are a test engineer. Generate tests for the feature described below.

## Feature: ${doc.title}
${doc.description || "No description provided."}

## Requirements to test:
${formatRequirements(doc.requirements ?? [])}

## User Flows:
${formatUserFlows(doc.userFlows ?? [])}

## Steps:
1. Read CLAUDE.md for tech stack and testing conventions
2. Explore the codebase for existing test patterns and frameworks
3. Find the source code implementing this feature
4. Generate test files covering each requirement and user flow
5. Place tests alongside existing tests or in the appropriate directory
6. Match the existing testing framework and patterns
7. git add -A && git commit -m "test: add tests for ${commitTitle}"
8. git push -u origin ${branchName}

## Rules:
- Only generate test files, do NOT modify source code
- Cover each requirement with at least one test case
- Do NOT run the tests`;

    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: doc.repoId,
      prompt,
      branchName,
      alreadyCompleted: false,
    };
  },
});

export const setRunning = internalMutation({
  args: { docId: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.docId, {
      testGenStatus: "running",
      testPrUrl: undefined,
    });
    return null;
  },
});

export const saveResult = internalMutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    branchName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.docId));

    const doc = await ctx.db.get(args.docId);
    if (!doc) return null;

    if (!args.success) {
      await ctx.db.patch(args.docId, {
        testGenStatus: "error",
        activeWorkflowId: undefined,
      });
      return null;
    }

    // The Claude CLI already did git push inside the sandbox.
    // We need to create the PR via a scheduled action since we
    // can't call GitHub API from a mutation. Store result for now.
    // The PR URL will be set by the createPr action if needed.
    await ctx.db.patch(args.docId, {
      testGenStatus: "completed",
      activeWorkflowId: undefined,
    });

    // Schedule PR creation
    const repo = await ctx.db.get(doc.repoId);
    if (repo) {
      await ctx.scheduler.runAfter(0, internal.testGenWorkflow.createPr, {
        docId: args.docId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName: args.branchName,
        docTitle: doc.title,
        installationId: repo.installationId,
      });
    }

    return null;
  },
});

/**
 * Creates a GitHub PR after test generation is complete.
 * Runs as an internal action (has network access for GitHub API).
 */
export const createPr = internalMutation({
  args: {
    docId: v.id("docs"),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    docTitle: v.string(),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // PR creation needs GitHub API access, so schedule an action
    await ctx.scheduler.runAfter(
      0,
      internal.testGenWorkflow.createPrAction,
      args,
    );
    return null;
  },
});

export const createPrAction = internalMutation({
  args: {
    docId: v.id("docs"),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    docTitle: v.string(),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async () => {
    // PR creation is handled by the Claude CLI script which does git push.
    // The PR itself needs to be created from a node action with GitHub token.
    // For now, skip automated PR creation — the branch is pushed and user
    // can create PR manually, or we can add a dedicated action later.
    return null;
  },
});

/**
 * Called by the sandbox via Convex HTTP API (authenticated with Clerk JWT).
 */
export const handleCompletion = authMutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !doc.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...testGenCompleteEvent,
      workflowId: doc.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    await ctx.db.insert("logs", {
      entityType: "testGen",
      entityId: String(args.docId),
      entityTitle: `Test Gen: ${doc.title}`,
      rawResultEvent: args.rawResultEvent,
      repoId: doc.repoId,
      createdAt: Date.now(),
    });

    return null;
  },
});

/**
 * Public mutation to start the test generation workflow.
 */
export const startTestGen = authMutation({
  args: {
    docId: v.id("docs"),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const workflowId = await workflow.start(
      ctx,
      internal.testGenWorkflow.testGenWorkflow,
      {
        docId: args.docId,
        userId: ctx.userId,
        installationId: args.installationId,
      },
    );

    await ctx.db.patch(args.docId, {
      activeWorkflowId: String(workflowId),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleDoc,
      { docId: args.docId, workflowId: String(workflowId) },
    );

    return null;
  },
});
