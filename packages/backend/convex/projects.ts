import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { roleValidator, phaseValidator } from "./validators";
import { authQuery, authMutation } from "./functions";

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
});

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(projectValidator),
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const result = [];
    for (const project of projects) {
      if (project.phase === "active" || project.phase === "completed") {
        const tasks = await ctx.db
          .query("agentTasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        if (tasks.length > 0) {
          const allDone = tasks.every((t) => t.status === "done");
          const anyActive = tasks.some(
            (t) =>
              t.status === "todo" ||
              t.status === "in_progress" ||
              t.status === "code_review",
          );
          if (allDone && project.phase === "active") {
            result.push({ ...project, phase: "completed" as const });
            continue;
          }
          if (anyActive && project.phase === "completed") {
            result.push({ ...project, phase: "active" as const });
            continue;
          }
        }
      }
      result.push(project);
    }
    return result;
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
    if (project.phase === "active" || project.phase === "completed") {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.id))
        .collect();
      if (tasks.length > 0) {
        const allDone = tasks.every((t) => t.status === "done");
        const anyActive = tasks.some(
          (t) =>
            t.status === "todo" ||
            t.status === "in_progress" ||
            t.status === "code_review",
        );
        if (allDone && project.phase === "active") {
          return { ...project, phase: "completed" as const };
        }
        if (anyActive && project.phase === "completed") {
          return { ...project, phase: "active" as const };
        }
      }
    }
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
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
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
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
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
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const deleteCascade = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.userId !== ctx.userId) {
      throw new Error("Not authorized");
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const task of tasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const run of runs) {
        await ctx.db.delete(run._id);
      }
      const dependencies = await ctx.db
        .query("taskDependencies")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const dep of dependencies) {
        await ctx.db.delete(dep._id);
      }
      const dependents = await ctx.db
        .query("taskDependencies")
        .withIndex("by_dependency", (q) => q.eq("dependsOnId", task._id))
        .collect();
      for (const dep of dependents) {
        await ctx.db.delete(dep._id);
      }
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_parent", (q) => q.eq("parentTaskId", task._id))
        .collect();
      for (const subtask of subtasks) {
        await ctx.db.delete(subtask._id);
      }
      await ctx.db.delete(task._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const clearMessages = authMutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
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
  }),
  handler: async (ctx, args) => {
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
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
    const branchName = `conductor/${slugify(spec.title)}`;
    let board = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", project.repoId))
      .first();
    if (!board) {
      const boardId = await ctx.db.insert("boards", {
        name: "Project Tasks",
        ownerId: ctx.userId,
        repoId: project.repoId,
        createdAt: Date.now(),
      });
      board = await ctx.db.get(boardId);
    }
    if (!board) {
      throw new Error("Failed to get or create board");
    }
    let column = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", board._id))
      .first();
    if (!column) {
      const columnId = await ctx.db.insert("columns", {
        boardId: board._id,
        name: "Backlog",
        order: 0,
        isRunColumn: false,
      });
      column = await ctx.db.get(columnId);
    }
    if (!column) {
      throw new Error("Failed to get or create column");
    }
    const taskIdMap = new Map<number, Id<"agentTasks">>();
    const now = Date.now();
    for (let i = 0; i < spec.tasks.length; i++) {
      const task = spec.tasks[i];
      const taskNumber = i + 1;
      const taskId = await ctx.db.insert("agentTasks", {
        boardId: board._id,
        columnId: column._id,
        title: task.title,
        description: task.description,
        repoId: project.repoId,
        projectId: args.projectId,
        taskNumber,
        status: "todo",
        order: i,
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
        boardId: board._id,
        columnId: column._id,
        title: audit.title,
        description: audit.description,
        repoId: project.repoId,
        projectId: args.projectId,
        taskNumber,
        status: "todo",
        order: spec.tasks.length + i,
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
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
    const branchName = `conductor/${slugify(args.title)}`;
    const projectId = await ctx.db.insert("projects", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      rawInput: args.title,
      phase: "active",
      branchName,
      projectStartDate: Date.now(),
      conversationHistory: [],
    });
    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId);
      if (task) {
        await ctx.db.patch(taskId, { projectId, updatedAt: Date.now() });
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
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
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
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
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
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.deleteSandbox, {
        sandboxId: project.sandboxId,
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
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
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
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");
    const messages = [...project.conversationHistory];
    const last = messages[messages.length - 1];
    if (!last) return null;
    if (args.content !== undefined) last.content = args.content;
    if (args.activityLog !== undefined) last.activityLog = args.activityLog;
    await ctx.db.patch(args.id, { conversationHistory: messages });
    return null;
  },
});
