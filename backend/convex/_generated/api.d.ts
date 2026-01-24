/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentExecution from "../agentExecution.js";
import type * as agentRuns from "../agentRuns.js";
import type * as agentTasks from "../agentTasks.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as boards from "../boards.js";
import type * as columns from "../columns.js";
import type * as docs from "../docs.js";
import type * as githubRepos from "../githubRepos.js";
import type * as projects from "../projects.js";
import type * as researchQueries from "../researchQueries.js";
import type * as sessions from "../sessions.js";
import type * as specs from "../specs.js";
import type * as subtasks from "../subtasks.js";
import type * as taskComments from "../taskComments.js";
import type * as taskDependencies from "../taskDependencies.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agentExecution: typeof agentExecution;
  agentRuns: typeof agentRuns;
  agentTasks: typeof agentTasks;
  analytics: typeof analytics;
  auth: typeof auth;
  boards: typeof boards;
  columns: typeof columns;
  docs: typeof docs;
  githubRepos: typeof githubRepos;
  projects: typeof projects;
  researchQueries: typeof researchQueries;
  sessions: typeof sessions;
  specs: typeof specs;
  subtasks: typeof subtasks;
  taskComments: typeof taskComments;
  taskDependencies: typeof taskDependencies;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
