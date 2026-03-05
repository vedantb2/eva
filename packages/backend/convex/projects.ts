import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { roleValidator, phaseValidator } from "./validators";
import {
  authQuery,
  authMutation,
  hasRepoAccess,
  getProjectWithAccess,
  deleteTaskRelatedData,
} from "./functions";

const conversationMessageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
});

const projectValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.optional(v.string()),
  baseBranch: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  lastSandboxActivity: v.optional(v.number()),
  phase: phaseValidator,
  rawInput: v.string(),
  generatedSpec: v.optional(v.string()),
  conversationHistory: v.array(conversationMessageValidator),
  projectLead: v.optional(v.id("users")),
  members: v.optional(v.array(v.id("users"))),
  projectStartDate: v.optional(v.number()),
  projectEndDate: v.optional(v.number()),
  deadline: v.optional(v.number()),
  activeWorkflowId: v.optional(v.string()),
  activeBuildWorkflowId: v.optional(v.string()),
  scheduledBuildAt: v.optional(v.number()),
  scheduledBuildFunctionId: v.optional(v.id("_scheduled_functions")),
});

const {
  conversationHistory: _ch,
  generatedSpec: _gs,
  ...projectSummaryFields
} = projectValidator.fields;
const projectSummaryValidator = v.object(projectSummaryFields);

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(projectSummaryValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return projects.map(
      ({ conversationHistory: _, generatedSpec: _g, ...rest }) => rest,
    );
  },
});

export const get = authQuery({
  args: { id: v.id("projects") },
  returns: v.union(projectValidator, v.null()),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      return null;
    }
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) return null;
    return project;
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    rawInput: v.string(),
    baseBranch: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    return await ctx.db.insert("projects", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      rawInput: args.rawInput,
      baseBranch: args.baseBranch,
      phase: "draft",
      projectStartDate: Date.now(),
      conversationHistory: [
        {
          role: "user",
          content: args.rawInput,
          userId: ctx.userId,
        },
      ],
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    branchName: v.optional(v.string()),
    generatedSpec: v.optional(v.string()),
    phase: v.optional(phaseValidator),
    projectLead: v.optional(v.id("users")),
    members: v.optional(v.array(v.id("users"))),
    projectStartDate: v.optional(v.number()),
    projectEndDate: v.optional(v.number()),
    deadline: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const addMessage = authMutation({
  args: {
    id: v.id("projects"),
    role: roleValidator,
    content: v.string(),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      conversationHistory: [
        ...project.conversationHistory,
        {
          role: args.role,
          content: args.content,
          activityLog: args.activityLog,
          userId: ctx.userId,
        },
      ],
    });
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const deleteCascade = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const task of tasks) {
      await deleteTaskRelatedData(ctx, task._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const clearMessages = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      conversationHistory: [],
    });
    return null;
  },
});

export const getTaskCount = authQuery({
  args: { projectId: v.id("projects") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      return 0;
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return tasks.length;
  },
});

export const getTaskProgress = authQuery({
  args: { projectId: v.id("projects") },
  returns: v.object({
    total: v.number(),
    todo: v.number(),
    in_progress: v.number(),
    business_review: v.number(),
    code_review: v.number(),
    done: v.number(),
    cancelled: v.number(),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (
      !project ||
      !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))
    ) {
      return {
        total: 0,
        todo: 0,
        in_progress: 0,
        business_review: 0,
        code_review: 0,
        done: 0,
        cancelled: 0,
      };
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      business_review: tasks.filter((t) => t.status === "business_review")
        .length,
      code_review: tasks.filter((t) => t.status === "code_review").length,
      done: tasks.filter((t) => t.status === "done").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
    };
  },
});

const AUDIT_TASKS = [
  {
    title: "Accessibility Audit",
    description:
      "Review all changes for WCAG 2.2 compliance (https://www.w3.org/TR/WCAG22/). Check semantic HTML, ARIA attributes, keyboard navigation, color contrast, focus management, and screen reader support.",
    subtasks: [
      "Check semantic HTML elements and landmark regions",
      "Verify ARIA attributes and roles are correct",
      "Check form labels, error messages, and input associations",
      "Verify images have appropriate alt text",
    ],
  },
  {
    title: "Testing Audit",
    description:
      "Review all diffs in the branch/PR and verify that tests are correct, complete, and aligned with the project requirements. Check test coverage, edge cases, assertions, and that tests actually validate the described behavior.",
    subtasks: [
      "Verify tests exist for all new/changed functionality",
      "Check test assertions match the project requirements",
      "Validate edge cases and error paths are covered",
      "Ensure tests are not trivially passing (false positives)",
      "Check mocks and test data are realistic",
    ],
  },
];

interface ParsedTask {
  title: string;
  description: string;
  dependencies: number[];
  subtasks: string[];
}

interface ParsedSpec {
  title: string;
  description: string;
  tasks: ParsedTask[];
}

function parseSpec(specJson: string): ParsedSpec {
  const parsed = JSON.parse(specJson);
  return {
    title: parsed.title ?? "",
    description: parsed.description ?? "",
    tasks: (parsed.tasks ?? []).map(
      (t: {
        title?: string;
        description?: string;
        dependencies?: number[];
        subtasks?: string[];
      }) => ({
        title: t.title ?? "",
        description: t.description ?? "",
        dependencies: t.dependencies ?? [],
        subtasks: t.subtasks ?? [],
      }),
    ),
  };
}

export const startDevelopment = authMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.phase !== "finalized") {
      throw new Error("Project must be finalized before starting development");
    }
    if (!project.generatedSpec) {
      throw new Error("Project has no generated spec");
    }
    const spec = parseSpec(project.generatedSpec);
    const branchName = `project/${args.projectId}`;
    const taskIdMap = new Map<number, Id<"agentTasks">>();
    const now = Date.now();
    for (let i = 0; i < spec.tasks.length; i++) {
      const task = spec.tasks[i];
      const taskNumber = i + 1;
      const taskId = await ctx.db.insert("agentTasks", {
        title: task.title,
        description: task.description,
        repoId: project.repoId,
        projectId: args.projectId,
        taskNumber,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
      });
      taskIdMap.set(taskNumber, taskId);
      for (let j = 0; j < task.subtasks.length; j++) {
        await ctx.db.insert("subtasks", {
          parentTaskId: taskId,
          title: task.subtasks[j],
          completed: false,
          order: j,
        });
      }
    }
    for (let i = 0; i < spec.tasks.length; i++) {
      const task = spec.tasks[i];
      const taskNumber = i + 1;
      const taskId = taskIdMap.get(taskNumber);
      if (!taskId) continue;
      for (const depNumber of task.dependencies) {
        const depTaskId = taskIdMap.get(depNumber);
        if (depTaskId) {
          await ctx.db.insert("taskDependencies", {
            taskId,
            dependsOnId: depTaskId,
          });
        }
      }
    }
    const specTaskIds = [...taskIdMap.values()];
    for (let i = 0; i < AUDIT_TASKS.length; i++) {
      const audit = AUDIT_TASKS[i];
      const taskNumber = spec.tasks.length + i + 1;
      const auditTaskId = await ctx.db.insert("agentTasks", {
        title: audit.title,
        description: audit.description,
        repoId: project.repoId,
        projectId: args.projectId,
        taskNumber,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
      });
      for (let j = 0; j < audit.subtasks.length; j++) {
        await ctx.db.insert("subtasks", {
          parentTaskId: auditTaskId,
          title: audit.subtasks[j],
          completed: false,
          order: j,
        });
      }
      for (const depId of specTaskIds) {
        await ctx.db.insert("taskDependencies", {
          taskId: auditTaskId,
          dependsOnId: depId,
        });
      }
    }
    await ctx.db.patch(args.projectId, {
      phase: "active",
      branchName,
      description: spec.description,
    });
    return null;
  },
});

export const createFromTasks = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    taskIds: v.array(v.id("agentTasks")),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      rawInput: args.title,
      phase: "active",
      projectStartDate: Date.now(),
      conversationHistory: [],
    });
    await ctx.db.patch(projectId, {
      branchName: `project/${projectId}`,
    });
    for (let i = 0; i < args.taskIds.length; i++) {
      const taskId = args.taskIds[i];
      const task = await ctx.db.get(taskId);
      if (task) {
        await ctx.db.patch(taskId, {
          projectId,
          taskNumber: i + 1,
          updatedAt: Date.now(),
        });
      }
    }
    return projectId;
  },
});

export const updatePrUrl = authMutation({
  args: {
    id: v.id("projects"),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, { prUrl: args.prUrl });
    return null;
  },
});

export const updateProjectSandbox = authMutation({
  args: {
    id: v.id("projects"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, {
      sandboxId: args.sandboxId,
      lastSandboxActivity: Date.now(),
    });
    return null;
  },
});

export const clearProjectSandbox = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    if (project.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
        sandboxId: project.sandboxId,
        repoId: project.repoId,
      });
    }
    await ctx.db.patch(args.id, {
      sandboxId: undefined,
      lastSandboxActivity: undefined,
    });
    return null;
  },
});

export const updateLastSandboxActivity = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    await ctx.db.patch(args.id, { lastSandboxActivity: Date.now() });
    return null;
  },
});

export const updateLastConversationMessage = authMutation({
  args: {
    id: v.id("projects"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await getProjectWithAccess(ctx.db, args.id, ctx.userId);
    const messages = [...project.conversationHistory];
    const last = messages[messages.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    await ctx.db.patch(args.id, { conversationHistory: messages });
    return null;
  },
});
