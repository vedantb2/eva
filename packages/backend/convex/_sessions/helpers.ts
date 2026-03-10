import { v } from "convex/values";
import { sessionFields } from "../validators";

export const sessionValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  ...sessionFields,
});
