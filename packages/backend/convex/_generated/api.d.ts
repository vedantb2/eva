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
import type * as _agentTasks_internal from "../_agentTasks/internal.js";
import type * as _agentTasks_mutations from "../_agentTasks/mutations.js";
import type * as _agentTasks_queries from "../_agentTasks/queries.js";
import type * as _agentTasks_sandbox from "../_agentTasks/sandbox.js";
import type * as _automations_crud from "../_automations/crud.js";
import type * as _automations_findings from "../_automations/findings.js";
import type * as _automations_runs from "../_automations/runs.js";
import type * as _automations_triggers from "../_automations/triggers.js";
import type * as _daytona_audit from "../_daytona/audit.js";
import type * as _daytona_callbackScript from "../_daytona/callbackScript.js";
import type * as _daytona_desktop from "../_daytona/desktop.js";
import type * as _daytona_devServer from "../_daytona/devServer.js";
import type * as _daytona_execution from "../_daytona/execution.js";
import type * as _daytona_git from "../_daytona/git.js";
import type * as _daytona_helpers from "../_daytona/helpers.js";
import type * as _daytona_launch from "../_daytona/launch.js";
import type * as _daytona_lifecycle from "../_daytona/lifecycle.js";
import type * as _daytona_prepareSandboxSteps from "../_daytona/prepareSandboxSteps.js";
import type * as _daytona_previewProxy from "../_daytona/previewProxy.js";
import type * as _daytona_services from "../_daytona/services.js";
import type * as _daytona_sessions from "../_daytona/sessions.js";
import type * as _daytona_volumes from "../_daytona/volumes.js";
import type * as _deployment_vercel from "../_deployment/vercel.js";
import type * as _designSessions_execution from "../_designSessions/execution.js";
import type * as _designSessions_mutations from "../_designSessions/mutations.js";
import type * as _designSessions_queries from "../_designSessions/queries.js";
import type * as _designSessions_sandbox from "../_designSessions/sandbox.js";
import type * as _designSessions_workflow from "../_designSessions/workflow.js";
import type * as _githubRepos_helpers from "../_githubRepos/helpers.js";
import type * as _githubRepos_mutations from "../_githubRepos/mutations.js";
import type * as _githubRepos_queries from "../_githubRepos/queries.js";
import type * as _githubRepos_sync from "../_githubRepos/sync.js";
import type * as _mentions_extractMentionedUserIds from "../_mentions/extractMentionedUserIds.js";
import type * as _mentions_mentionToken from "../_mentions/mentionToken.js";
import type * as _mentions_resolveDocMentions from "../_mentions/resolveDocMentions.js";
import type * as _migrations_cleanup from "../_migrations/cleanup.js";
import type * as _migrations_deleteRepos from "../_migrations/deleteRepos.js";
import type * as _migrations_deploymentUrl from "../_migrations/deploymentUrl.js";
import type * as _migrations_sessionModes from "../_migrations/sessionModes.js";
import type * as _projects_development from "../_projects/development.js";
import type * as _projects_helpers from "../_projects/helpers.js";
import type * as _projects_internal from "../_projects/internal.js";
import type * as _projects_mutations from "../_projects/mutations.js";
import type * as _projects_queries from "../_projects/queries.js";
import type * as _projects_sandbox from "../_projects/sandbox.js";
import type * as _queues_helpers from "../_queues/helpers.js";
import type * as _repoSnapshots_builds from "../_repoSnapshots/builds.js";
import type * as _repoSnapshots_config from "../_repoSnapshots/config.js";
import type * as _repoSnapshots_repoMetadata from "../_repoSnapshots/repoMetadata.js";
import type * as _sessions_helpers from "../_sessions/helpers.js";
import type * as _sessions_internal from "../_sessions/internal.js";
import type * as _sessions_mutations from "../_sessions/mutations.js";
import type * as _sessions_pty from "../_sessions/pty.js";
import type * as _sessions_queries from "../_sessions/queries.js";
import type * as _sessions_sandbox from "../_sessions/sandbox.js";
import type * as _taskWorkflow_audit from "../_taskWorkflow/audit.js";
import type * as _taskWorkflow_auditParser from "../_taskWorkflow/auditParser.js";
import type * as _taskWorkflow_deploymentHelpers from "../_taskWorkflow/deploymentHelpers.js";
import type * as _taskWorkflow_events from "../_taskWorkflow/events.js";
import type * as _taskWorkflow_helpers from "../_taskWorkflow/helpers.js";
import type * as _taskWorkflow_livenessProbe from "../_taskWorkflow/livenessProbe.js";
import type * as _taskWorkflow_prAudit from "../_taskWorkflow/prAudit.js";
import type * as _taskWorkflow_prompts from "../_taskWorkflow/prompts.js";
import type * as _taskWorkflow_publicMutations from "../_taskWorkflow/publicMutations.js";
import type * as _taskWorkflow_queries from "../_taskWorkflow/queries.js";
import type * as _taskWorkflow_recovery from "../_taskWorkflow/recovery.js";
import type * as _taskWorkflow_runLifecycle from "../_taskWorkflow/runLifecycle.js";
import type * as _taskWorkflow_scheduling from "../_taskWorkflow/scheduling.js";
import type * as _taskWorkflow_urls from "../_taskWorkflow/urls.js";
import type * as _taskWorkflow_watchdog from "../_taskWorkflow/watchdog.js";
import type * as _taskWorkflow_workflowDefinition from "../_taskWorkflow/workflowDefinition.js";
import type * as _validators_aiModels from "../_validators/aiModels.js";
import type * as _validators_enums from "../_validators/enums.js";
import type * as _validators_personalisation from "../_validators/personalisation.js";
import type * as _validators_shapes from "../_validators/shapes.js";
import type * as _validators_tableFields from "../_validators/tableFields.js";
import type * as agentRuns from "../agentRuns.js";
import type * as agentTasks from "../agentTasks.js";
import type * as analytics from "../analytics.js";
import type * as annotations from "../annotations.js";
import type * as auditCategories from "../auditCategories.js";
import type * as audits from "../audits.js";
import type * as auth from "../auth.js";
import type * as automationWorkflow from "../automationWorkflow.js";
import type * as automations from "../automations.js";
import type * as buildWorkflow from "../buildWorkflow.js";
import type * as changelog from "../changelog.js";
import type * as cronManager from "../cronManager.js";
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
import type * as fixEnvVars from "../fixEnvVars.js";
import type * as functions from "../functions.js";
import type * as github from "../github.js";
import type * as githubAuth from "../githubAuth.js";
import type * as githubRepos from "../githubRepos.js";
import type * as githubWebhook from "../githubWebhook.js";
import type * as http from "../http.js";
import type * as linearActions from "../linearActions.js";
import type * as logs from "../logs.js";
import type * as mcp_icon from "../mcp/icon.js";
import type * as mcp_native from "../mcp/native.js";
import type * as mcp_nodeActions from "../mcp/nodeActions.js";
import type * as mcp_oauth from "../mcp/oauth.js";
import type * as mcp_queries from "../mcp/queries.js";
import type * as mcp_routes from "../mcp/routes.js";
import type * as mcp_supabase from "../mcp/supabase.js";
import type * as mcp_tokenMinter from "../mcp/tokenMinter.js";
import type * as mcp_tools from "../mcp/tools.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as prBody from "../prBody.js";
import type * as presence from "../presence.js";
import type * as projectInterviewWorkflow from "../projectInterviewWorkflow.js";
import type * as projectSandboxWorkflow from "../projectSandboxWorkflow.js";
import type * as projects from "../projects.js";
import type * as prompts_design from "../prompts/design.js";
import type * as prompts_doc from "../prompts/doc.js";
import type * as prompts_index from "../prompts/index.js";
import type * as prompts_project from "../prompts/project.js";
import type * as prompts_shared from "../prompts/shared.js";
import type * as prosemirrorSync from "../prosemirrorSync.js";
import type * as pty from "../pty.js";
import type * as queuedMessages from "../queuedMessages.js";
import type * as repoEnvVars from "../repoEnvVars.js";
import type * as repoEnvVarsActions from "../repoEnvVarsActions.js";
import type * as repoSnapshots from "../repoSnapshots.js";
import type * as repoUtils from "../repoUtils.js";
import type * as sandboxAuthConfig from "../sandboxAuthConfig.js";
import type * as sandboxConfigFiles from "../sandboxConfigFiles.js";
import type * as sandboxJwt from "../sandboxJwt.js";
import type * as sandboxPanes from "../sandboxPanes.js";
import type * as screenshots from "../screenshots.js";
import type * as sessionWorkflow from "../sessionWorkflow.js";
import type * as sessions from "../sessions.js";
import type * as snapshotActions from "../snapshotActions.js";
import type * as snapshotWorkflow from "../snapshotWorkflow.js";
import type * as streaming from "../streaming.js";
import type * as summarizeWorkflow from "../summarizeWorkflow.js";
import type * as syncSettings from "../syncSettings.js";
import type * as taskComments from "../taskComments.js";
import type * as taskDependencies from "../taskDependencies.js";
import type * as taskProof from "../taskProof.js";
import type * as taskSandboxEvents from "../taskSandboxEvents.js";
import type * as taskSandboxWorkflow from "../taskSandboxWorkflow.js";
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
  "_agentTasks/internal": typeof _agentTasks_internal;
  "_agentTasks/mutations": typeof _agentTasks_mutations;
  "_agentTasks/queries": typeof _agentTasks_queries;
  "_agentTasks/sandbox": typeof _agentTasks_sandbox;
  "_automations/crud": typeof _automations_crud;
  "_automations/findings": typeof _automations_findings;
  "_automations/runs": typeof _automations_runs;
  "_automations/triggers": typeof _automations_triggers;
  "_daytona/audit": typeof _daytona_audit;
  "_daytona/callbackScript": typeof _daytona_callbackScript;
  "_daytona/desktop": typeof _daytona_desktop;
  "_daytona/devServer": typeof _daytona_devServer;
  "_daytona/execution": typeof _daytona_execution;
  "_daytona/git": typeof _daytona_git;
  "_daytona/helpers": typeof _daytona_helpers;
  "_daytona/launch": typeof _daytona_launch;
  "_daytona/lifecycle": typeof _daytona_lifecycle;
  "_daytona/prepareSandboxSteps": typeof _daytona_prepareSandboxSteps;
  "_daytona/previewProxy": typeof _daytona_previewProxy;
  "_daytona/services": typeof _daytona_services;
  "_daytona/sessions": typeof _daytona_sessions;
  "_daytona/volumes": typeof _daytona_volumes;
  "_deployment/vercel": typeof _deployment_vercel;
  "_designSessions/execution": typeof _designSessions_execution;
  "_designSessions/mutations": typeof _designSessions_mutations;
  "_designSessions/queries": typeof _designSessions_queries;
  "_designSessions/sandbox": typeof _designSessions_sandbox;
  "_designSessions/workflow": typeof _designSessions_workflow;
  "_githubRepos/helpers": typeof _githubRepos_helpers;
  "_githubRepos/mutations": typeof _githubRepos_mutations;
  "_githubRepos/queries": typeof _githubRepos_queries;
  "_githubRepos/sync": typeof _githubRepos_sync;
  "_mentions/extractMentionedUserIds": typeof _mentions_extractMentionedUserIds;
  "_mentions/mentionToken": typeof _mentions_mentionToken;
  "_mentions/resolveDocMentions": typeof _mentions_resolveDocMentions;
  "_migrations/cleanup": typeof _migrations_cleanup;
  "_migrations/deleteRepos": typeof _migrations_deleteRepos;
  "_migrations/deploymentUrl": typeof _migrations_deploymentUrl;
  "_migrations/sessionModes": typeof _migrations_sessionModes;
  "_projects/development": typeof _projects_development;
  "_projects/helpers": typeof _projects_helpers;
  "_projects/internal": typeof _projects_internal;
  "_projects/mutations": typeof _projects_mutations;
  "_projects/queries": typeof _projects_queries;
  "_projects/sandbox": typeof _projects_sandbox;
  "_queues/helpers": typeof _queues_helpers;
  "_repoSnapshots/builds": typeof _repoSnapshots_builds;
  "_repoSnapshots/config": typeof _repoSnapshots_config;
  "_repoSnapshots/repoMetadata": typeof _repoSnapshots_repoMetadata;
  "_sessions/helpers": typeof _sessions_helpers;
  "_sessions/internal": typeof _sessions_internal;
  "_sessions/mutations": typeof _sessions_mutations;
  "_sessions/pty": typeof _sessions_pty;
  "_sessions/queries": typeof _sessions_queries;
  "_sessions/sandbox": typeof _sessions_sandbox;
  "_taskWorkflow/audit": typeof _taskWorkflow_audit;
  "_taskWorkflow/auditParser": typeof _taskWorkflow_auditParser;
  "_taskWorkflow/deploymentHelpers": typeof _taskWorkflow_deploymentHelpers;
  "_taskWorkflow/events": typeof _taskWorkflow_events;
  "_taskWorkflow/helpers": typeof _taskWorkflow_helpers;
  "_taskWorkflow/livenessProbe": typeof _taskWorkflow_livenessProbe;
  "_taskWorkflow/prAudit": typeof _taskWorkflow_prAudit;
  "_taskWorkflow/prompts": typeof _taskWorkflow_prompts;
  "_taskWorkflow/publicMutations": typeof _taskWorkflow_publicMutations;
  "_taskWorkflow/queries": typeof _taskWorkflow_queries;
  "_taskWorkflow/recovery": typeof _taskWorkflow_recovery;
  "_taskWorkflow/runLifecycle": typeof _taskWorkflow_runLifecycle;
  "_taskWorkflow/scheduling": typeof _taskWorkflow_scheduling;
  "_taskWorkflow/urls": typeof _taskWorkflow_urls;
  "_taskWorkflow/watchdog": typeof _taskWorkflow_watchdog;
  "_taskWorkflow/workflowDefinition": typeof _taskWorkflow_workflowDefinition;
  "_validators/aiModels": typeof _validators_aiModels;
  "_validators/enums": typeof _validators_enums;
  "_validators/personalisation": typeof _validators_personalisation;
  "_validators/shapes": typeof _validators_shapes;
  "_validators/tableFields": typeof _validators_tableFields;
  agentRuns: typeof agentRuns;
  agentTasks: typeof agentTasks;
  analytics: typeof analytics;
  annotations: typeof annotations;
  auditCategories: typeof auditCategories;
  audits: typeof audits;
  auth: typeof auth;
  automationWorkflow: typeof automationWorkflow;
  automations: typeof automations;
  buildWorkflow: typeof buildWorkflow;
  changelog: typeof changelog;
  cronManager: typeof cronManager;
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
  fixEnvVars: typeof fixEnvVars;
  functions: typeof functions;
  github: typeof github;
  githubAuth: typeof githubAuth;
  githubRepos: typeof githubRepos;
  githubWebhook: typeof githubWebhook;
  http: typeof http;
  linearActions: typeof linearActions;
  logs: typeof logs;
  "mcp/icon": typeof mcp_icon;
  "mcp/native": typeof mcp_native;
  "mcp/nodeActions": typeof mcp_nodeActions;
  "mcp/oauth": typeof mcp_oauth;
  "mcp/queries": typeof mcp_queries;
  "mcp/routes": typeof mcp_routes;
  "mcp/supabase": typeof mcp_supabase;
  "mcp/tokenMinter": typeof mcp_tokenMinter;
  "mcp/tools": typeof mcp_tools;
  messages: typeof messages;
  migrations: typeof migrations;
  notifications: typeof notifications;
  prBody: typeof prBody;
  presence: typeof presence;
  projectInterviewWorkflow: typeof projectInterviewWorkflow;
  projectSandboxWorkflow: typeof projectSandboxWorkflow;
  projects: typeof projects;
  "prompts/design": typeof prompts_design;
  "prompts/doc": typeof prompts_doc;
  "prompts/index": typeof prompts_index;
  "prompts/project": typeof prompts_project;
  "prompts/shared": typeof prompts_shared;
  prosemirrorSync: typeof prosemirrorSync;
  pty: typeof pty;
  queuedMessages: typeof queuedMessages;
  repoEnvVars: typeof repoEnvVars;
  repoEnvVarsActions: typeof repoEnvVarsActions;
  repoSnapshots: typeof repoSnapshots;
  repoUtils: typeof repoUtils;
  sandboxAuthConfig: typeof sandboxAuthConfig;
  sandboxConfigFiles: typeof sandboxConfigFiles;
  sandboxJwt: typeof sandboxJwt;
  sandboxPanes: typeof sandboxPanes;
  screenshots: typeof screenshots;
  sessionWorkflow: typeof sessionWorkflow;
  sessions: typeof sessions;
  snapshotActions: typeof snapshotActions;
  snapshotWorkflow: typeof snapshotWorkflow;
  streaming: typeof streaming;
  summarizeWorkflow: typeof summarizeWorkflow;
  syncSettings: typeof syncSettings;
  taskComments: typeof taskComments;
  taskDependencies: typeof taskDependencies;
  taskProof: typeof taskProof;
  taskSandboxEvents: typeof taskSandboxEvents;
  taskSandboxWorkflow: typeof taskSandboxWorkflow;
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
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  prosemirrorSync: import("@convex-dev/prosemirror-sync/_generated/component.js").ComponentApi<"prosemirrorSync">;
  timeline: import("convex-timeline/_generated/component.js").ComponentApi<"timeline">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  crons: import("@convex-dev/crons/_generated/component.js").ComponentApi<"crons">;
};
