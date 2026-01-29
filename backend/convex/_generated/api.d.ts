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
import type * as annotations from "../annotations.js";
import type * as auth from "../auth.js";
import type * as boards from "../boards.js";
import type * as columns from "../columns.js";
import type * as docs from "../docs.js";
import type * as evaluationReports from "../evaluationReports.js";
import type * as githubRepos from "../githubRepos.js";
import type * as presence from "../presence.js";
import type * as projects from "../projects.js";
import type * as researchQueries from "../researchQueries.js";
import type * as routines from "../routines.js";
import type * as savedQueries from "../savedQueries.js";
import type * as sessions from "../sessions.js";
import type * as specs from "../specs.js";
import type * as subtasks from "../subtasks.js";
import type * as taskComments from "../taskComments.js";
import type * as taskDependencies from "../taskDependencies.js";
import type * as users from "../users.js";

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
  annotations: typeof annotations;
  auth: typeof auth;
  boards: typeof boards;
  columns: typeof columns;
  docs: typeof docs;
  evaluationReports: typeof evaluationReports;
  githubRepos: typeof githubRepos;
  presence: typeof presence;
  projects: typeof projects;
  researchQueries: typeof researchQueries;
  routines: typeof routines;
  savedQueries: typeof savedQueries;
  sessions: typeof sessions;
  specs: typeof specs;
  subtasks: typeof subtasks;
  taskComments: typeof taskComments;
  taskDependencies: typeof taskDependencies;
  users: typeof users;
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
};
