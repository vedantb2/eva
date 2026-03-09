/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _agentTasks_drafts from "../_agentTasks/drafts.js";
import type * as _agentTasks_execution from "../_agentTasks/execution.js";
import type * as _agentTasks_helpers from "../_agentTasks/helpers.js";
import type * as _agentTasks_mutations from "../_agentTasks/mutations.js";
import type * as _agentTasks_queries from "../_agentTasks/queries.js";
import type * as _daytona_audit from "../_daytona/audit.js";
import type * as _daytona_callbackScript from "../_daytona/callbackScript.js";
import type * as _daytona_desktop from "../_daytona/desktop.js";
import type * as _daytona_devServer from "../_daytona/devServer.js";
import type * as _daytona_execution from "../_daytona/execution.js";
import type * as _daytona_git from "../_daytona/git.js";
import type * as _daytona_helpers from "../_daytona/helpers.js";
import type * as _daytona_launch from "../_daytona/launch.js";
import type * as _daytona_lifecycle from "../_daytona/lifecycle.js";
import type * as _daytona_services from "../_daytona/services.js";
import type * as _daytona_sessions from "../_daytona/sessions.js";
import type * as _daytona_volumes from "../_daytona/volumes.js";
import type * as _githubRepos_helpers from "../_githubRepos/helpers.js";
import type * as _githubRepos_mutations from "../_githubRepos/mutations.js";
import type * as _githubRepos_queries from "../_githubRepos/queries.js";
import type * as _githubRepos_sync from "../_githubRepos/sync.js";
import type * as _projects_development from "../_projects/development.js";
import type * as _projects_helpers from "../_projects/helpers.js";
import type * as _projects_mutations from "../_projects/mutations.js";
import type * as _projects_queries from "../_projects/queries.js";
import type * as _sessions_extension from "../_sessions/extension.js";
import type * as _sessions_helpers from "../_sessions/helpers.js";
import type * as _sessions_internal from "../_sessions/internal.js";
import type * as _sessions_mutations from "../_sessions/mutations.js";
import type * as _sessions_pty from "../_sessions/pty.js";
import type * as _sessions_queries from "../_sessions/queries.js";
import type * as _sessions_sandbox from "../_sessions/sandbox.js";
import type * as _taskWorkflow_audit from "../_taskWorkflow/audit.js";
import type * as _taskWorkflow_auditParser from "../_taskWorkflow/auditParser.js";
import type * as _taskWorkflow_events from "../_taskWorkflow/events.js";
import type * as _taskWorkflow_helpers from "../_taskWorkflow/helpers.js";
import type * as _taskWorkflow_prompts from "../_taskWorkflow/prompts.js";
import type * as _taskWorkflow_publicMutations from "../_taskWorkflow/publicMutations.js";
import type * as _taskWorkflow_queries from "../_taskWorkflow/queries.js";
import type * as _taskWorkflow_recovery from "../_taskWorkflow/recovery.js";
import type * as _taskWorkflow_runLifecycle from "../_taskWorkflow/runLifecycle.js";
import type * as _taskWorkflow_scheduling from "../_taskWorkflow/scheduling.js";
import type * as _taskWorkflow_watchdog from "../_taskWorkflow/watchdog.js";
import type * as _taskWorkflow_workflowDefinition from "../_taskWorkflow/workflowDefinition.js";
import type * as agentRuns from "../agentRuns.js";
import type * as agentTasks from "../agentTasks.js";
import type * as analytics from "../analytics.js";
import type * as annotations from "../annotations.js";
import type * as auditCategories from "../auditCategories.js";
import type * as audits from "../audits.js";
import type * as auth from "../auth.js";
import type * as backfillParentRepoId from "../backfillParentRepoId.js";
import type * as buildWorkflow from "../buildWorkflow.js";
import type * as daytona from "../daytona.js";
import type * as designPersonas from "../designPersonas.js";
import type * as designSessions from "../designSessions.js";
import type * as designWorkflow from "../designWorkflow.js";
import type * as docInterviewWorkflow from "../docInterviewWorkflow.js";
import type * as docPrdWorkflow from "../docPrdWorkflow.js";
import type * as docs from "../docs.js";
import type * as encryption from "../encryption.js";
import type * as envVarResolver from "../envVarResolver.js";
import type * as evaluationReports from "../evaluationReports.js";
import type * as evaluationWorkflow from "../evaluationWorkflow.js";
import type * as extensionReleases from "../extensionReleases.js";
import type * as functions from "../functions.js";
import type * as github from "../github.js";
import type * as githubAuth from "../githubAuth.js";
import type * as githubRepos from "../githubRepos.js";
import type * as githubWebhook from "../githubWebhook.js";
import type * as http from "../http.js";
import type * as linearActions from "../linearActions.js";
import type * as logs from "../logs.js";
import type * as mcpRoutes from "../mcpRoutes.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as projectInterviewWorkflow from "../projectInterviewWorkflow.js";
import type * as projects from "../projects.js";
import type * as prompts_design from "../prompts/design.js";
import type * as prompts_doc from "../prompts/doc.js";
import type * as prompts_index from "../prompts/index.js";
import type * as prompts_project from "../prompts/project.js";
import type * as prompts_shared from "../prompts/shared.js";
import type * as prosemirrorSync from "../prosemirrorSync.js";
import type * as pty from "../pty.js";
import type * as repoEnvVars from "../repoEnvVars.js";
import type * as repoEnvVarsActions from "../repoEnvVarsActions.js";
import type * as repoSnapshots from "../repoSnapshots.js";
import type * as repoUtils from "../repoUtils.js";
import type * as researchQueries from "../researchQueries.js";
import type * as researchQueryWorkflow from "../researchQueryWorkflow.js";
import type * as sandboxAuthConfig from "../sandboxAuthConfig.js";
import type * as sandboxJwt from "../sandboxJwt.js";
import type * as savedQueries from "../savedQueries.js";
import type * as screenshots from "../screenshots.js";
import type * as sessionWorkflow from "../sessionWorkflow.js";
import type * as sessions from "../sessions.js";
import type * as snapshotActions from "../snapshotActions.js";
import type * as streaming from "../streaming.js";
import type * as subtasks from "../subtasks.js";
import type * as summarizeWorkflow from "../summarizeWorkflow.js";
import type * as taskComments from "../taskComments.js";
import type * as taskDependencies from "../taskDependencies.js";
import type * as taskProof from "../taskProof.js";
import type * as taskWorkflow from "../taskWorkflow.js";
import type * as taskWorkflowActions from "../taskWorkflowActions.js";
import type * as teamEnvVars from "../teamEnvVars.js";
import type * as teamEnvVarsActions from "../teamEnvVarsActions.js";
import type * as teamMembers from "../teamMembers.js";
import type * as teams from "../teams.js";
import type * as testGenWorkflow from "../testGenWorkflow.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";
import type * as workflowManager from "../workflowManager.js";
import type * as workflowWatchdog from "../workflowWatchdog.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_agentTasks/drafts": typeof _agentTasks_drafts;
  "_agentTasks/execution": typeof _agentTasks_execution;
  "_agentTasks/helpers": typeof _agentTasks_helpers;
  "_agentTasks/mutations": typeof _agentTasks_mutations;
  "_agentTasks/queries": typeof _agentTasks_queries;
  "_daytona/audit": typeof _daytona_audit;
  "_daytona/callbackScript": typeof _daytona_callbackScript;
  "_daytona/desktop": typeof _daytona_desktop;
  "_daytona/devServer": typeof _daytona_devServer;
  "_daytona/execution": typeof _daytona_execution;
  "_daytona/git": typeof _daytona_git;
  "_daytona/helpers": typeof _daytona_helpers;
  "_daytona/launch": typeof _daytona_launch;
  "_daytona/lifecycle": typeof _daytona_lifecycle;
  "_daytona/services": typeof _daytona_services;
  "_daytona/sessions": typeof _daytona_sessions;
  "_daytona/volumes": typeof _daytona_volumes;
  "_githubRepos/helpers": typeof _githubRepos_helpers;
  "_githubRepos/mutations": typeof _githubRepos_mutations;
  "_githubRepos/queries": typeof _githubRepos_queries;
  "_githubRepos/sync": typeof _githubRepos_sync;
  "_projects/development": typeof _projects_development;
  "_projects/helpers": typeof _projects_helpers;
  "_projects/mutations": typeof _projects_mutations;
  "_projects/queries": typeof _projects_queries;
  "_sessions/extension": typeof _sessions_extension;
  "_sessions/helpers": typeof _sessions_helpers;
  "_sessions/internal": typeof _sessions_internal;
  "_sessions/mutations": typeof _sessions_mutations;
  "_sessions/pty": typeof _sessions_pty;
  "_sessions/queries": typeof _sessions_queries;
  "_sessions/sandbox": typeof _sessions_sandbox;
  "_taskWorkflow/audit": typeof _taskWorkflow_audit;
  "_taskWorkflow/auditParser": typeof _taskWorkflow_auditParser;
  "_taskWorkflow/events": typeof _taskWorkflow_events;
  "_taskWorkflow/helpers": typeof _taskWorkflow_helpers;
  "_taskWorkflow/prompts": typeof _taskWorkflow_prompts;
  "_taskWorkflow/publicMutations": typeof _taskWorkflow_publicMutations;
  "_taskWorkflow/queries": typeof _taskWorkflow_queries;
  "_taskWorkflow/recovery": typeof _taskWorkflow_recovery;
  "_taskWorkflow/runLifecycle": typeof _taskWorkflow_runLifecycle;
  "_taskWorkflow/scheduling": typeof _taskWorkflow_scheduling;
  "_taskWorkflow/watchdog": typeof _taskWorkflow_watchdog;
  "_taskWorkflow/workflowDefinition": typeof _taskWorkflow_workflowDefinition;
  agentRuns: typeof agentRuns;
  agentTasks: typeof agentTasks;
  analytics: typeof analytics;
  annotations: typeof annotations;
  auditCategories: typeof auditCategories;
  audits: typeof audits;
  auth: typeof auth;
  backfillParentRepoId: typeof backfillParentRepoId;
  buildWorkflow: typeof buildWorkflow;
  daytona: typeof daytona;
  designPersonas: typeof designPersonas;
  designSessions: typeof designSessions;
  designWorkflow: typeof designWorkflow;
  docInterviewWorkflow: typeof docInterviewWorkflow;
  docPrdWorkflow: typeof docPrdWorkflow;
  docs: typeof docs;
  encryption: typeof encryption;
  envVarResolver: typeof envVarResolver;
  evaluationReports: typeof evaluationReports;
  evaluationWorkflow: typeof evaluationWorkflow;
  extensionReleases: typeof extensionReleases;
  functions: typeof functions;
  github: typeof github;
  githubAuth: typeof githubAuth;
  githubRepos: typeof githubRepos;
  githubWebhook: typeof githubWebhook;
  http: typeof http;
  linearActions: typeof linearActions;
  logs: typeof logs;
  mcpRoutes: typeof mcpRoutes;
  messages: typeof messages;
  migrations: typeof migrations;
  notifications: typeof notifications;
  presence: typeof presence;
  projectInterviewWorkflow: typeof projectInterviewWorkflow;
  projects: typeof projects;
  "prompts/design": typeof prompts_design;
  "prompts/doc": typeof prompts_doc;
  "prompts/index": typeof prompts_index;
  "prompts/project": typeof prompts_project;
  "prompts/shared": typeof prompts_shared;
  prosemirrorSync: typeof prosemirrorSync;
  pty: typeof pty;
  repoEnvVars: typeof repoEnvVars;
  repoEnvVarsActions: typeof repoEnvVarsActions;
  repoSnapshots: typeof repoSnapshots;
  repoUtils: typeof repoUtils;
  researchQueries: typeof researchQueries;
  researchQueryWorkflow: typeof researchQueryWorkflow;
  sandboxAuthConfig: typeof sandboxAuthConfig;
  sandboxJwt: typeof sandboxJwt;
  savedQueries: typeof savedQueries;
  screenshots: typeof screenshots;
  sessionWorkflow: typeof sessionWorkflow;
  sessions: typeof sessions;
  snapshotActions: typeof snapshotActions;
  streaming: typeof streaming;
  subtasks: typeof subtasks;
  summarizeWorkflow: typeof summarizeWorkflow;
  taskComments: typeof taskComments;
  taskDependencies: typeof taskDependencies;
  taskProof: typeof taskProof;
  taskWorkflow: typeof taskWorkflow;
  taskWorkflowActions: typeof taskWorkflowActions;
  teamEnvVars: typeof teamEnvVars;
  teamEnvVarsActions: typeof teamEnvVarsActions;
  teamMembers: typeof teamMembers;
  teams: typeof teams;
  testGenWorkflow: typeof testGenWorkflow;
  users: typeof users;
  validators: typeof validators;
  workflowManager: typeof workflowManager;
  workflowWatchdog: typeof workflowWatchdog;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: {
    public: {
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { sessionToken: string },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        {
          interval?: number;
          roomId: string;
          sessionId: string;
          userId: string;
        },
        { roomToken: string; sessionToken: string }
      >;
      list: FunctionReference<
        "query",
        "internal",
        { limit?: number; roomToken: string },
        Array<{
          data?: any;
          lastDisconnected: number;
          online: boolean;
          userId: string;
        }>
      >;
      listRoom: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; roomId: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; userId: string },
        Array<{ lastDisconnected: number; online: boolean; roomId: string }>
      >;
      removeRoom: FunctionReference<
        "mutation",
        "internal",
        { roomId: string },
        null
      >;
      removeRoomUser: FunctionReference<
        "mutation",
        "internal",
        { roomId: string; userId: string },
        null
      >;
      updateRoomUser: FunctionReference<
        "mutation",
        "internal",
        { data?: any; roomId: string; userId: string },
        null
      >;
    };
  };
  prosemirrorSync: {
    lib: {
      deleteDocument: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        null
      >;
      deleteSnapshots: FunctionReference<
        "mutation",
        "internal",
        { afterVersion?: number; beforeVersion?: number; id: string },
        null
      >;
      deleteSteps: FunctionReference<
        "mutation",
        "internal",
        {
          afterVersion?: number;
          beforeTs: number;
          deleteNewerThanLatestSnapshot?: boolean;
          id: string;
        },
        null
      >;
      getSnapshot: FunctionReference<
        "query",
        "internal",
        { id: string; version?: number },
        { content: null } | { content: string; version: number }
      >;
      getSteps: FunctionReference<
        "query",
        "internal",
        { id: string; version: number },
        {
          clientIds: Array<string | number>;
          steps: Array<string>;
          version: number;
        }
      >;
      latestVersion: FunctionReference<
        "query",
        "internal",
        { id: string },
        null | number
      >;
      submitSnapshot: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          id: string;
          pruneSnapshots?: boolean;
          version: number;
        },
        null
      >;
      submitSteps: FunctionReference<
        "mutation",
        "internal",
        {
          clientId: string | number;
          id: string;
          steps: Array<string>;
          version: number;
        },
        | {
            clientIds: Array<string | number>;
            status: "needs-rebase";
            steps: Array<string>;
          }
        | { status: "synced" }
      >;
    };
  };
  timeline: {
    lib: {
      clear: FunctionReference<"mutation", "internal", { scope: string }, null>;
      createCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { name: string; scope: string },
        null
      >;
      deleteCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { name: string; scope: string },
        null
      >;
      deleteScope: FunctionReference<
        "mutation",
        "internal",
        { scope: string },
        null
      >;
      getCheckpointDocument: FunctionReference<
        "query",
        "internal",
        { name: string; scope: string },
        any | null
      >;
      getCurrentDocument: FunctionReference<
        "query",
        "internal",
        { scope: string },
        any | null
      >;
      getDocumentAtPosition: FunctionReference<
        "query",
        "internal",
        { position: number; scope: string },
        any | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { scope: string },
        {
          canRedo: boolean;
          canUndo: boolean;
          length: number;
          position: number | null;
        }
      >;
      listCheckpoints: FunctionReference<
        "query",
        "internal",
        { scope: string },
        Array<{ name: string; position: number | null }>
      >;
      listNodes: FunctionReference<
        "query",
        "internal",
        { scope: string },
        Array<{ document: any; position: number }>
      >;
      push: FunctionReference<
        "mutation",
        "internal",
        { document: any; maxNodes?: number; scope: string },
        null
      >;
      redo: FunctionReference<
        "mutation",
        "internal",
        { count?: number; scope: string },
        any | null
      >;
      restoreCheckpoint: FunctionReference<
        "mutation",
        "internal",
        { maxNodes?: number; name: string; scope: string },
        any
      >;
      undo: FunctionReference<
        "mutation",
        "internal",
        { count?: number; scope: string },
        any | null
      >;
    };
  };
  workflow: {
    event: {
      create: FunctionReference<
        "mutation",
        "internal",
        { name: string; workflowId: string },
        string
      >;
      send: FunctionReference<
        "mutation",
        "internal",
        {
          eventId?: string;
          name?: string;
          result:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId?: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        string
      >;
    };
    journal: {
      load: FunctionReference<
        "query",
        "internal",
        { shortCircuit?: boolean; workflowId: string },
        {
          blocked?: boolean;
          journalEntries: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          ok: boolean;
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      startSteps: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          steps: Array<{
            retry?:
              | boolean
              | { base: number; initialBackoffMs: number; maxAttempts: number };
            schedulerOptions?: { runAt?: number } | { runAfter?: number };
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
          }>;
          workflowId: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        Array<{
          _creationTime: number;
          _id: string;
          step:
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                functionType: "query" | "mutation" | "action";
                handle: string;
                inProgress: boolean;
                kind?: "function";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workId?: string;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                handle: string;
                inProgress: boolean;
                kind: "workflow";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workflowId?: string;
              }
            | {
                args: { eventId?: string };
                argsSize: number;
                completedAt?: number;
                eventId?: string;
                inProgress: boolean;
                kind: "event";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
              };
          stepNumber: number;
          workflowId: string;
        }>
      >;
    };
    workflow: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        null
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        boolean
      >;
      complete: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          runResult:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId: string;
        },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          maxParallelism?: number;
          onComplete?: { context?: any; fnHandle: string };
          startAsync?: boolean;
          workflowArgs: any;
          workflowHandle: string;
          workflowName: string;
        },
        string
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          inProgress: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            context?: any;
            name?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listByName: FunctionReference<
        "query",
        "internal",
        {
          name: string;
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            context?: any;
            name?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listSteps: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          workflowId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            completedAt?: number;
            eventId?: string;
            kind: "function" | "workflow" | "event";
            name: string;
            nestedWorkflowId?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt: number;
            stepId: string;
            stepNumber: number;
            workId?: string;
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
  };
  crons: {
    public: {
      del: FunctionReference<
        "mutation",
        "internal",
        { identifier: { id: string } | { name: string } },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { identifier: { id: string } | { name: string } },
        {
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        }>
      >;
      register: FunctionReference<
        "mutation",
        "internal",
        {
          args: Record<string, any>;
          functionHandle: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        },
        string
      >;
    };
  };
};
