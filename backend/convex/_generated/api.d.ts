/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as calendar from "../calendar.js";
import type * as culture from "../culture.js";
import type * as lessons from "../lessons.js";
import type * as seed from "../seed.js";
import type * as seedCalendar from "../seedCalendar.js";
import type * as seedCulture from "../seedCulture.js";
import type * as vocabulary from "../vocabulary.js";

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
  auth: typeof auth;
  calendar: typeof calendar;
  culture: typeof culture;
  lessons: typeof lessons;
  seed: typeof seed;
  seedCalendar: typeof seedCalendar;
  seedCulture: typeof seedCulture;
  vocabulary: typeof vocabulary;
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
