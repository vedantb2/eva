import { v } from "convex/values";
import { sessionFields } from "../validators";

/** Placeholder title until the first message generates a real one (or user renames). */
export const DEFAULT_SESSION_TITLE = "New session";

/** Convex validator for a full session document including system fields. */
export const sessionValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  ...sessionFields,
});
