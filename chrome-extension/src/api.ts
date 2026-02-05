import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  auth: {
    createOrMigrateUser: FunctionReference<
      "mutation",
      "public",
      { firstName?: string; fullName?: string; lastName?: string },
      { userId: Id<"users">; wasCreated: boolean; wasMigrated?: boolean }
    >;
    ensureUserExists: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      { userId: Id<"users">; wasCreated: boolean }
    >;
    getTheme: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      "light" | "dark" | null
    >;
    getToolbarVisible: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      boolean | null
    >;
    isCurrentUserAdmin: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      boolean
    >;
    me: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Id<"users"> | null
    >;
    setTheme: FunctionReference<
      "mutation",
      "public",
      { theme: "light" | "dark" },
      null
    >;
    setToolbarVisible: FunctionReference<
      "mutation",
      "public",
      { visible: boolean },
      null
    >;
  };
  projects: {
    list: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"projects">;
        branchName?: string;
        conversationHistory: Array<{
          activityLog?: string;
          content: string;
          role: "user" | "assistant";
          userId?: Id<"users">;
        }>;
        description?: string;
        generatedSpec?: string;
        lastSandboxActivity?: number;
        phase: "draft" | "finalized" | "active" | "completed";
        prUrl?: string;
        rawInput: string;
        repoId: Id<"githubRepos">;
        sandboxId?: string;
        title: string;
        userId: Id<"users">;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"projects"> },
      {
        _creationTime: number;
        _id: Id<"projects">;
        branchName?: string;
        conversationHistory: Array<{
          activityLog?: string;
          content: string;
          role: "user" | "assistant";
          userId?: Id<"users">;
        }>;
        description?: string;
        generatedSpec?: string;
        lastSandboxActivity?: number;
        phase: "draft" | "finalized" | "active" | "completed";
        prUrl?: string;
        rawInput: string;
        repoId: Id<"githubRepos">;
        sandboxId?: string;
        title: string;
        userId: Id<"users">;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { rawInput: string; repoId: Id<"githubRepos">; title: string },
      Id<"projects">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        branchName?: string;
        description?: string;
        generatedSpec?: string;
        id: Id<"projects">;
        phase?: "draft" | "finalized" | "active" | "completed";
        title?: string;
      },
      null
    >;
    addMessage: FunctionReference<
      "mutation",
      "public",
      {
        activityLog?: string;
        content: string;
        id: Id<"projects">;
        role: "user" | "assistant";
      },
      null
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"projects"> },
      null
    >;
    deleteCascade: FunctionReference<
      "mutation",
      "public",
      { id: Id<"projects"> },
      null
    >;
    clearMessages: FunctionReference<
      "mutation",
      "public",
      { id: Id<"projects"> },
      null
    >;
    getTaskCount: FunctionReference<
      "query",
      "public",
      { projectId: Id<"projects"> },
      number
    >;
    getTaskProgress: FunctionReference<
      "query",
      "public",
      { projectId: Id<"projects"> },
      {
        business_review: number;
        code_review: number;
        done: number;
        in_progress: number;
        todo: number;
        total: number;
      }
    >;
    startDevelopment: FunctionReference<
      "mutation",
      "public",
      { projectId: Id<"projects"> },
      null
    >;
    createFromTasks: FunctionReference<
      "mutation",
      "public",
      {
        repoId: Id<"githubRepos">;
        taskIds: Array<Id<"agentTasks">>;
        title: string;
      },
      Id<"projects">
    >;
    updatePrUrl: FunctionReference<
      "mutation",
      "public",
      { id: Id<"projects">; prUrl: string },
      null
    >;
    updateProjectSandbox: FunctionReference<
      "mutation",
      "public",
      { id: Id<"projects">; sandboxId: string },
      null
    >;
    clearProjectSandbox: FunctionReference<
      "mutation",
      "public",
      { id: Id<"projects"> },
      null
    >;
    updateLastSandboxActivity: FunctionReference<
      "mutation",
      "public",
      { id: Id<"projects"> },
      null
    >;
    updateLastConversationMessage: FunctionReference<
      "mutation",
      "public",
      { activityLog?: string; content?: string; id: Id<"projects"> },
      null
    >;
  };
  boards: {
    list: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Array<{
        _creationTime: number;
        _id: Id<"boards">;
        createdAt: number;
        name: string;
        ownerId: string;
        repoId?: Id<"githubRepos">;
      }>
    >;
    listByRepo: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"boards">;
        createdAt: number;
        name: string;
        ownerId: string;
        repoId?: Id<"githubRepos">;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"boards"> },
      {
        _creationTime: number;
        _id: Id<"boards">;
        createdAt: number;
        name: string;
        ownerId: string;
        repoId?: Id<"githubRepos">;
      } | null
    >;
    getWithColumns: FunctionReference<
      "query",
      "public",
      { id: Id<"boards"> },
      {
        board: {
          _creationTime: number;
          _id: Id<"boards">;
          createdAt: number;
          name: string;
          ownerId: string;
          repoId?: Id<"githubRepos">;
        };
        columns: Array<{
          _creationTime: number;
          _id: Id<"columns">;
          boardId: Id<"boards">;
          isRunColumn?: boolean;
          name: string;
          order: number;
          tasks: Array<{
            _creationTime: number;
            _id: Id<"agentTasks">;
            boardId: Id<"boards">;
            branchName?: string;
            columnId: Id<"columns">;
            createdAt: number;
            description?: string;
            order: number;
            projectId?: Id<"projects">;
            repoId?: Id<"githubRepos">;
            status:
              | "todo"
              | "in_progress"
              | "business_review"
              | "code_review"
              | "done";
            taskNumber?: number;
            title: string;
            updatedAt: number;
          }>;
        }>;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { name: string; repoId?: Id<"githubRepos"> },
      Id<"boards">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      { id: Id<"boards">; name: string },
      null
    >;
    remove: FunctionReference<"mutation", "public", { id: Id<"boards"> }, null>;
  };
  columns: {
    listByBoard: FunctionReference<
      "query",
      "public",
      { boardId: Id<"boards"> },
      Array<{
        _creationTime: number;
        _id: Id<"columns">;
        boardId: Id<"boards">;
        isRunColumn?: boolean;
        name: string;
        order: number;
      }>
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { boardId: Id<"boards">; name: string },
      Id<"columns">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      { id: Id<"columns">; isRunColumn?: boolean; name?: string },
      null
    >;
    reorder: FunctionReference<
      "mutation",
      "public",
      { id: Id<"columns">; newOrder: number },
      null
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"columns"> },
      null
    >;
  };
  agentTasks: {
    listByBoard: FunctionReference<
      "query",
      "public",
      { boardId: Id<"boards"> },
      Array<{
        _creationTime: number;
        _id: Id<"agentTasks">;
        assignedTo?: Id<"users">;
        boardId: Id<"boards">;
        columnId: Id<"columns">;
        createdAt: number;
        createdBy?: Id<"users">;
        description?: string;
        order: number;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        status:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
        taskNumber?: number;
        title: string;
        updatedAt: number;
      }>
    >;
    listByColumn: FunctionReference<
      "query",
      "public",
      { columnId: Id<"columns"> },
      Array<{
        _creationTime: number;
        _id: Id<"agentTasks">;
        assignedTo?: Id<"users">;
        boardId: Id<"boards">;
        columnId: Id<"columns">;
        createdAt: number;
        createdBy?: Id<"users">;
        description?: string;
        order: number;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        status:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
        taskNumber?: number;
        title: string;
        updatedAt: number;
      }>
    >;
    listByProject: FunctionReference<
      "query",
      "public",
      { projectId: Id<"projects"> },
      Array<{
        _creationTime: number;
        _id: Id<"agentTasks">;
        assignedTo?: Id<"users">;
        boardId: Id<"boards">;
        columnId: Id<"columns">;
        createdAt: number;
        createdBy?: Id<"users">;
        description?: string;
        order: number;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        status:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
        taskNumber?: number;
        title: string;
        updatedAt: number;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"agentTasks"> },
      {
        _creationTime: number;
        _id: Id<"agentTasks">;
        assignedTo?: Id<"users">;
        boardId: Id<"boards">;
        columnId: Id<"columns">;
        createdAt: number;
        createdBy?: Id<"users">;
        description?: string;
        order: number;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        status:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
        taskNumber?: number;
        title: string;
        updatedAt: number;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        columnId: Id<"columns">;
        description?: string;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        status?:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
        taskNumber?: number;
        title: string;
      },
      Id<"agentTasks">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        assignedTo?: Id<"users">;
        description?: string;
        id: Id<"agentTasks">;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        taskNumber?: number;
        title?: string;
      },
      null
    >;
    moveToColumn: FunctionReference<
      "mutation",
      "public",
      { columnId: Id<"columns">; id: Id<"agentTasks"> },
      Id<"agentRuns"> | null
    >;
    updateOrder: FunctionReference<
      "mutation",
      "public",
      { id: Id<"agentTasks">; order: number },
      null
    >;
    updateStatus: FunctionReference<
      "mutation",
      "public",
      {
        id: Id<"agentTasks">;
        status:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
      },
      null
    >;
    getActiveTasks: FunctionReference<
      "query",
      "public",
      { repoId?: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"agentTasks">;
        assignedTo?: Id<"users">;
        boardId: Id<"boards">;
        columnId: Id<"columns">;
        createdAt: number;
        createdBy?: Id<"users">;
        description?: string;
        order: number;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        status:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
        taskNumber?: number;
        title: string;
        updatedAt: number;
      }>
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"agentTasks"> },
      null
    >;
    getAllTasks: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"agentTasks">;
        assignedTo?: Id<"users">;
        boardId: Id<"boards">;
        columnId: Id<"columns">;
        createdAt: number;
        createdBy?: Id<"users">;
        description?: string;
        order: number;
        projectId?: Id<"projects">;
        repoId?: Id<"githubRepos">;
        status:
          | "todo"
          | "in_progress"
          | "business_review"
          | "code_review"
          | "done";
        taskNumber?: number;
        title: string;
        updatedAt: number;
      }>
    >;
    createQuickTask: FunctionReference<
      "mutation",
      "public",
      {
        assignedTo?: Id<"users">;
        description?: string;
        repoId: Id<"githubRepos">;
        title: string;
      },
      Id<"agentTasks">
    >;
    startExecution: FunctionReference<
      "mutation",
      "public",
      { id: Id<"agentTasks"> },
      {
        branchName?: string;
        installationId: number;
        isFirstTaskOnBranch: boolean;
        projectId?: Id<"projects">;
        repoId: Id<"githubRepos">;
        runId: Id<"agentRuns">;
        taskId: Id<"agentTasks">;
      }
    >;
    getDependentTasks: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      Array<{ _id: Id<"agentTasks">; taskNumber?: number; title: string }>
    >;
    assignToProject: FunctionReference<
      "mutation",
      "public",
      { projectId: Id<"projects">; taskIds: Array<Id<"agentTasks">> },
      null
    >;
    deleteCascade: FunctionReference<
      "mutation",
      "public",
      { id: Id<"agentTasks"> },
      null
    >;
  };
  agentRuns: {
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"agentRuns"> },
      {
        _creationTime: number;
        _id: Id<"agentRuns">;
        error?: string;
        finishedAt?: number;
        logs: Array<{
          level: "info" | "warn" | "error";
          message: string;
          timestamp: number;
        }>;
        prUrl?: string;
        resultSummary?: string;
        startedAt?: number;
        status: "queued" | "running" | "success" | "error";
        taskId: Id<"agentTasks">;
      } | null
    >;
    getWithDetails: FunctionReference<
      "query",
      "public",
      { id: Id<"agentRuns"> },
      {
        _creationTime: number;
        _id: Id<"agentRuns">;
        boardId: Id<"boards">;
        boardName: string;
        error?: string;
        finishedAt?: number;
        logs: Array<{
          level: "info" | "warn" | "error";
          message: string;
          timestamp: number;
        }>;
        prUrl?: string;
        resultSummary?: string;
        startedAt?: number;
        status: "queued" | "running" | "success" | "error";
        taskDescription?: string;
        taskId: Id<"agentTasks">;
        taskTitle: string;
      } | null
    >;
    listByTask: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      Array<{
        _creationTime: number;
        _id: Id<"agentRuns">;
        error?: string;
        finishedAt?: number;
        logs: Array<{
          level: "info" | "warn" | "error";
          message: string;
          timestamp: number;
        }>;
        prUrl?: string;
        resultSummary?: string;
        startedAt?: number;
        status: "queued" | "running" | "success" | "error";
        taskId: Id<"agentTasks">;
      }>
    >;
    listAll: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Array<{
        _creationTime: number;
        _id: Id<"agentRuns">;
        boardId: Id<"boards">;
        boardName: string;
        error?: string;
        finishedAt?: number;
        logs: Array<{
          level: "info" | "warn" | "error";
          message: string;
          timestamp: number;
        }>;
        prUrl?: string;
        resultSummary?: string;
        startedAt?: number;
        status: "queued" | "running" | "success" | "error";
        taskId: Id<"agentTasks">;
        taskTitle: string;
      }>
    >;
    updateStatus: FunctionReference<
      "mutation",
      "public",
      {
        id: Id<"agentRuns">;
        status: "queued" | "running" | "success" | "error";
      },
      null
    >;
    appendLog: FunctionReference<
      "mutation",
      "public",
      {
        id: Id<"agentRuns">;
        level: "info" | "warn" | "error";
        message: string;
      },
      null
    >;
    complete: FunctionReference<
      "mutation",
      "public",
      {
        error?: string;
        id: Id<"agentRuns">;
        prUrl?: string;
        resultSummary?: string;
        success: boolean;
      },
      null
    >;
  };
  githubRepos: {
    list: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Array<{
        _creationTime: number;
        _id: Id<"githubRepos">;
        installationId: number;
        name: string;
        owner: string;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"githubRepos"> },
      {
        _creationTime: number;
        _id: Id<"githubRepos">;
        installationId: number;
        name: string;
        owner: string;
      } | null
    >;
    getByOwnerAndName: FunctionReference<
      "query",
      "public",
      { name: string; owner: string },
      {
        _creationTime: number;
        _id: Id<"githubRepos">;
        installationId: number;
        name: string;
        owner: string;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { installationId: number; name: string; owner: string },
      Id<"githubRepos">
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"githubRepos"> },
      null
    >;
  };
  subtasks: {
    listByTask: FunctionReference<
      "query",
      "public",
      { parentTaskId: Id<"agentTasks"> },
      Array<{
        _creationTime: number;
        _id: Id<"subtasks">;
        completed: boolean;
        order: number;
        parentTaskId: Id<"agentTasks">;
        title: string;
      }>
    >;
    markCompleted: FunctionReference<
      "mutation",
      "public",
      { completedIndices: Array<number>; parentTaskId: Id<"agentTasks"> },
      null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { parentTaskId: Id<"agentTasks">; title: string },
      Id<"subtasks">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      { completed?: boolean; id: Id<"subtasks">; title?: string },
      null
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"subtasks"> },
      null
    >;
    reorder: FunctionReference<
      "mutation",
      "public",
      { updates: Array<{ id: Id<"subtasks">; order: number }> },
      null
    >;
  };
  taskComments: {
    listByTask: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      Array<{
        _creationTime: number;
        _id: Id<"taskComments">;
        authorId: string;
        content: string;
        createdAt: number;
        taskId: Id<"agentTasks">;
      }>
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { content: string; taskId: Id<"agentTasks"> },
      Id<"taskComments">
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"taskComments"> },
      null
    >;
  };
  specs: {
    generateSpec: FunctionReference<
      "action",
      "public",
      { description: string },
      { description: string; subtasks: Array<string>; title: string }
    >;
  };
  taskDependencies: {
    getForTask: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      Array<{
        _creationTime: number;
        _id: Id<"taskDependencies">;
        dependsOnId: Id<"agentTasks">;
        taskId: Id<"agentTasks">;
      }>
    >;
    getDependents: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      Array<{
        _creationTime: number;
        _id: Id<"taskDependencies">;
        dependsOnId: Id<"agentTasks">;
        taskId: Id<"agentTasks">;
      }>
    >;
    getDependencies: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      Array<{
        _id: Id<"agentTasks">;
        status: string;
        taskNumber?: number;
        title: string;
      }>
    >;
    isBlocked: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      boolean
    >;
    add: FunctionReference<
      "mutation",
      "public",
      { dependsOnId: Id<"agentTasks">; taskId: Id<"agentTasks"> },
      Id<"taskDependencies">
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"taskDependencies"> },
      null
    >;
    removeByTasks: FunctionReference<
      "mutation",
      "public",
      { dependsOnId: Id<"agentTasks">; taskId: Id<"agentTasks"> },
      null
    >;
  };
  sessions: {
    list: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"sessions">;
        archived?: boolean;
        branchName?: string;
        createdBy?: Id<"users">;
        fileDiffs?: Array<{ diff: string; file: string; status: string }>;
        lastActivityAt?: number;
        messages: Array<{
          activityLog?: string;
          content: string;
          mode?: "execute" | "ask" | "plan" | "flag";
          role: "user" | "assistant";
          timestamp: number;
          userId?: Id<"users">;
        }>;
        prUrl?: string;
        ptySessionId?: string;
        repoId: Id<"githubRepos">;
        sandboxId?: string;
        status: "active" | "closed";
        summary?: Array<string>;
        title: string;
        userId: Id<"users">;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"sessions"> },
      {
        _creationTime: number;
        _id: Id<"sessions">;
        archived?: boolean;
        branchName?: string;
        createdBy?: Id<"users">;
        fileDiffs?: Array<{ diff: string; file: string; status: string }>;
        lastActivityAt?: number;
        messages: Array<{
          activityLog?: string;
          content: string;
          mode?: "execute" | "ask" | "plan" | "flag";
          role: "user" | "assistant";
          timestamp: number;
          userId?: Id<"users">;
        }>;
        prUrl?: string;
        ptySessionId?: string;
        repoId: Id<"githubRepos">;
        sandboxId?: string;
        status: "active" | "closed";
        summary?: Array<string>;
        title: string;
        userId: Id<"users">;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { repoId: Id<"githubRepos">; title: string },
      Id<"sessions">
    >;
    addMessage: FunctionReference<
      "mutation",
      "public",
      {
        activityLog?: string;
        content: string;
        id: Id<"sessions">;
        mode?: "execute" | "ask" | "plan" | "flag";
        role: "user" | "assistant";
      },
      null
    >;
    updateStatus: FunctionReference<
      "mutation",
      "public",
      { id: Id<"sessions">; status: "active" | "closed" },
      null
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        branchName?: string;
        id: Id<"sessions">;
        prUrl?: string;
        title?: string;
      },
      null
    >;
    updateSummary: FunctionReference<
      "mutation",
      "public",
      { id: Id<"sessions">; summary: Array<string> },
      null
    >;
    archive: FunctionReference<
      "mutation",
      "public",
      { id: Id<"sessions"> },
      null
    >;
    updateSandbox: FunctionReference<
      "mutation",
      "public",
      {
        branchName?: string;
        id: Id<"sessions">;
        prUrl?: string;
        sandboxId?: string;
      },
      null
    >;
    clearSandbox: FunctionReference<
      "mutation",
      "public",
      { id: Id<"sessions"> },
      null
    >;
    updatePtySession: FunctionReference<
      "mutation",
      "public",
      { id: Id<"sessions">; ptySessionId?: string },
      null
    >;
    updateFileDiffs: FunctionReference<
      "mutation",
      "public",
      {
        fileDiffs: Array<{ diff: string; file: string; status: string }>;
        id: Id<"sessions">;
      },
      null
    >;
    getOrCreateExtensionSession: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; repoId: Id<"githubRepos"> },
      {
        id: string;
        messages: Array<{ content: string; role: "user" | "assistant" }>;
        repoId: string;
      }
    >;
    updateLastMessage: FunctionReference<
      "mutation",
      "public",
      { activityLog?: string; content?: string; id: Id<"sessions"> },
      null
    >;
  };
  analytics: {
    getTaskStats: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos">; startTime?: number },
      {
        byStatus: {
          business_review: number;
          code_review: number;
          done: number;
          in_progress: number;
          todo: number;
        };
        total: number;
      }
    >;
    getRunStats: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos">; startTime?: number },
      {
        byStatus: {
          error: number;
          queued: number;
          running: number;
          success: number;
        };
        prsCreated: number;
        successRate: number;
        total: number;
      }
    >;
    getSessionStats: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos">; startTime?: number },
      {
        active: number;
        messagesByMode: {
          ask: number;
          execute: number;
          flag: number;
          plan: number;
        };
        total: number;
      }
    >;
    getProjectStats: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos">; startTime?: number },
      {
        byPhase: {
          active: number;
          completed: number;
          draft: number;
          finalized: number;
        };
        topProjects: Array<{
          id: Id<"projects">;
          tasksDone: number;
          tasksTotal: number;
          title: string;
        }>;
        total: number;
      }
    >;
    getImpactStats: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos">; startTime?: number },
      {
        prsShipped: number;
        sessionsWithPr: number;
        shipRate: number;
        tasksCompleted: number;
        totalSessions: number;
      }
    >;
    getActiveUsers: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      { count: number }
    >;
    getActivityTimeline: FunctionReference<
      "query",
      "public",
      { bucketSizeMs: number; repoId: Id<"githubRepos">; startTime: number },
      Array<{
        date: number;
        prsShipped: number;
        runs: number;
        sessions: number;
        tasks: number;
      }>
    >;
    getLeaderboard: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos">; startTime?: number },
      Array<{
        clerkId: string;
        fullName?: string;
        prsCreated: number;
        sessionsWithPr: number;
        tasksCompleted: number;
      }>
    >;
  };
  docs: {
    list: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"docs">;
        content: string;
        createdAt: number;
        description?: string;
        repoId: Id<"githubRepos">;
        requirements?: Array<string>;
        title: string;
        updatedAt: number;
        userFlows?: Array<{ name: string; steps: Array<string> }>;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"docs"> },
      {
        _creationTime: number;
        _id: Id<"docs">;
        content: string;
        createdAt: number;
        description?: string;
        repoId: Id<"githubRepos">;
        requirements?: Array<string>;
        title: string;
        updatedAt: number;
        userFlows?: Array<{ name: string; steps: Array<string> }>;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        description?: string;
        repoId: Id<"githubRepos">;
        requirements?: Array<string>;
        title: string;
        userFlows?: Array<{ name: string; steps: Array<string> }>;
      },
      Id<"docs">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        content?: string;
        description?: string;
        id: Id<"docs">;
        requirements?: Array<string>;
        title?: string;
        userFlows?: Array<{ name: string; steps: Array<string> }>;
      },
      null
    >;
    remove: FunctionReference<"mutation", "public", { id: Id<"docs"> }, null>;
    saveVersion: FunctionReference<
      "mutation",
      "public",
      { content: string; id: Id<"docs"> },
      null
    >;
    timelineUndo: FunctionReference<
      "mutation",
      "public",
      { id: Id<"docs"> },
      { content: string; title: string } | null
    >;
    timelineRedo: FunctionReference<
      "mutation",
      "public",
      { id: Id<"docs"> },
      { content: string; title: string } | null
    >;
    timelineStatus: FunctionReference<
      "query",
      "public",
      { id: Id<"docs"> },
      {
        canRedo: boolean;
        canUndo: boolean;
        length: number;
        position: number | null;
      }
    >;
    timelineHistory: FunctionReference<
      "query",
      "public",
      { id: Id<"docs"> },
      Array<{ position: number; title: string }>
    >;
  };
  researchQueries: {
    list: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"researchQueries">;
        createdAt: number;
        createdBy?: Id<"users">;
        messages: Array<{
          content: string;
          role: "user" | "assistant";
          timestamp: number;
          userId?: Id<"users">;
        }>;
        repoId: Id<"githubRepos">;
        title: string;
        updatedAt: number;
        userId: Id<"users">;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"researchQueries"> },
      {
        _creationTime: number;
        _id: Id<"researchQueries">;
        createdAt: number;
        createdBy?: Id<"users">;
        messages: Array<{
          content: string;
          role: "user" | "assistant";
          timestamp: number;
          userId?: Id<"users">;
        }>;
        repoId: Id<"githubRepos">;
        title: string;
        updatedAt: number;
        userId: Id<"users">;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { repoId: Id<"githubRepos">; title: string },
      Id<"researchQueries">
    >;
    addMessage: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        id: Id<"researchQueries">;
        role: "user" | "assistant";
      },
      null
    >;
    updateLastMessage: FunctionReference<
      "mutation",
      "public",
      { content: string; id: Id<"researchQueries"> },
      null
    >;
    update: FunctionReference<
      "mutation",
      "public",
      { id: Id<"researchQueries">; title?: string },
      null
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"researchQueries"> },
      null
    >;
    getSchemaInfo: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      {
        availableQueries: Array<string>;
        tables: Array<{
          description: string;
          fields: Array<string>;
          name: string;
        }>;
      }
    >;
  };
  evaluationReports: {
    listByDoc: FunctionReference<
      "query",
      "public",
      { docId: Id<"docs"> },
      Array<{
        _creationTime: number;
        _id: Id<"evaluationReports">;
        createdAt: number;
        docId: Id<"docs">;
        error?: string;
        repoId: Id<"githubRepos">;
        results: Array<{
          detail: string;
          passed: boolean;
          requirement: string;
        }>;
        status: "pending" | "running" | "completed" | "error";
        summary?: string;
        updatedAt: number;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"evaluationReports"> },
      {
        _creationTime: number;
        _id: Id<"evaluationReports">;
        createdAt: number;
        docId: Id<"docs">;
        error?: string;
        repoId: Id<"githubRepos">;
        results: Array<{
          detail: string;
          passed: boolean;
          requirement: string;
        }>;
        status: "pending" | "running" | "completed" | "error";
        summary?: string;
        updatedAt: number;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { docId: Id<"docs">; repoId: Id<"githubRepos"> },
      Id<"evaluationReports">
    >;
    updateEvalStatus: FunctionReference<
      "mutation",
      "public",
      {
        id: Id<"evaluationReports">;
        status: "pending" | "running" | "completed" | "error";
      },
      null
    >;
    completeEval: FunctionReference<
      "mutation",
      "public",
      {
        id: Id<"evaluationReports">;
        results: Array<{
          detail: string;
          passed: boolean;
          requirement: string;
        }>;
        summary: string;
      },
      null
    >;
    failEval: FunctionReference<
      "mutation",
      "public",
      { error: string; id: Id<"evaluationReports"> },
      null
    >;
    updateEvalSummary: FunctionReference<
      "mutation",
      "public",
      { id: Id<"evaluationReports">; summary: string },
      null
    >;
  };
  savedQueries: {
    list: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"savedQueries">;
        createdAt: number;
        query: string;
        repoId: Id<"githubRepos">;
        title: string;
        updatedAt: number;
        userId: Id<"users">;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"savedQueries"> },
      {
        _creationTime: number;
        _id: Id<"savedQueries">;
        createdAt: number;
        query: string;
        repoId: Id<"githubRepos">;
        title: string;
        updatedAt: number;
        userId: Id<"users">;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      { query: string; repoId: Id<"githubRepos">; title: string },
      Id<"savedQueries">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      { id: Id<"savedQueries">; query?: string; title?: string },
      null
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"savedQueries"> },
      null
    >;
  };
  routines: {
    list: FunctionReference<
      "query",
      "public",
      { repoId: Id<"githubRepos"> },
      Array<{
        _creationTime: number;
        _id: Id<"routines">;
        createdAt: number;
        description?: string;
        enabled: boolean;
        lastRunAt?: number;
        query: string;
        repoId: Id<"githubRepos">;
        schedule?: string;
        title: string;
        updatedAt: number;
        userId: Id<"users">;
      }>
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"routines"> },
      {
        _creationTime: number;
        _id: Id<"routines">;
        createdAt: number;
        description?: string;
        enabled: boolean;
        lastRunAt?: number;
        query: string;
        repoId: Id<"githubRepos">;
        schedule?: string;
        title: string;
        updatedAt: number;
        userId: Id<"users">;
      } | null
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        query: string;
        repoId: Id<"githubRepos">;
        schedule?: string;
        title: string;
      },
      Id<"routines">
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        enabled?: boolean;
        id: Id<"routines">;
        query?: string;
        schedule?: string;
        title?: string;
      },
      null
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"routines"> },
      null
    >;
  };
  annotations: {
    getByUrl: FunctionReference<
      "query",
      "public",
      { pageUrl: string },
      string | null
    >;
    remove: FunctionReference<"mutation", "public", { pageUrl: string }, null>;
    save: FunctionReference<
      "mutation",
      "public",
      { pageUrl: string; pins: string },
      null
    >;
  };
  users: {
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"users"> },
      { firstName?: string; lastName?: string; lastSeenAt?: number } | null
    >;
    listAll: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Array<{
        _id: Id<"users">;
        firstName?: string;
        fullName?: string;
        lastName?: string;
        role?: "business" | "dev";
      }>
    >;
  };
  presence: {
    heartbeat: FunctionReference<
      "mutation",
      "public",
      { interval: number; roomId: string; sessionId: string; userId: string },
      any
    >;
    list: FunctionReference<"query", "public", { roomToken: string }, any>;
    disconnect: FunctionReference<
      "mutation",
      "public",
      { sessionToken: string },
      any
    >;
  };
  taskProof: {
    generateUploadUrl: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      string
    >;
    save: FunctionReference<
      "mutation",
      "public",
      {
        fileName: string;
        fileType: string;
        storageId: Id<"_storage">;
        taskId: Id<"agentTasks">;
      },
      Id<"taskProof">
    >;
    listByTask: FunctionReference<
      "query",
      "public",
      { taskId: Id<"agentTasks"> },
      Array<{
        _creationTime: number;
        _id: Id<"taskProof">;
        createdAt: number;
        fileName: string;
        fileType: string;
        storageId: Id<"_storage">;
        taskId: Id<"agentTasks">;
        url: string | null;
      }>
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { id: Id<"taskProof"> },
      null
    >;
  };
  notifications: {
    countUnread: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      number
    >;
    create: FunctionReference<
      "mutation",
      "public",
      {
        href?: string;
        message?: string;
        repoId?: Id<"githubRepos">;
        title: string;
        type:
          | "routine_complete"
          | "export_ready"
          | "task_complete"
          | "task_assigned"
          | "comment_added"
          | "run_completed"
          | "system";
        userId: Id<"users">;
      },
      Id<"notifications">
    >;
    get: FunctionReference<
      "query",
      "public",
      { id: Id<"notifications"> },
      {
        _creationTime: number;
        _id: Id<"notifications">;
        createdAt: number;
        href?: string;
        message?: string;
        read: boolean;
        repoId?: Id<"githubRepos">;
        title: string;
        type:
          | "routine_complete"
          | "export_ready"
          | "task_complete"
          | "task_assigned"
          | "comment_added"
          | "run_completed"
          | "system";
        userId: Id<"users">;
      } | null
    >;
    list: FunctionReference<
      "query",
      "public",
      Record<string, never>,
      Array<{
        _creationTime: number;
        _id: Id<"notifications">;
        createdAt: number;
        href?: string;
        message?: string;
        read: boolean;
        repoId?: Id<"githubRepos">;
        title: string;
        type:
          | "routine_complete"
          | "export_ready"
          | "task_complete"
          | "task_assigned"
          | "comment_added"
          | "run_completed"
          | "system";
        userId: Id<"users">;
      }>
    >;
    markAllAsRead: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      null
    >;
    markAsRead: FunctionReference<
      "mutation",
      "public",
      { id: Id<"notifications"> },
      null
    >;
  };
  prosemirrorSync: {
    getSnapshot: FunctionReference<
      "query",
      "public",
      { id: string; version?: number },
      { content: null } | { content: string; version: number }
    >;
    submitSnapshot: FunctionReference<
      "mutation",
      "public",
      { content: string; id: string; version: number },
      null
    >;
    latestVersion: FunctionReference<
      "query",
      "public",
      { id: string },
      null | number
    >;
    getSteps: FunctionReference<
      "query",
      "public",
      { id: string; version: number },
      any
    >;
    submitSteps: FunctionReference<
      "mutation",
      "public",
      {
        clientId: string | number;
        id: string;
        steps: Array<string>;
        version: number;
      },
      any
    >;
  };
};
export type InternalApiType = {};
