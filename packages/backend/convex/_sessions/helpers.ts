import { v } from "convex/values";
import { sessionFields } from "../validators";

/** Convex validator for a full session document including system fields. */
export const sessionValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  ...sessionFields,
});
