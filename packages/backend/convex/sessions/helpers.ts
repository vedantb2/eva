import { v } from "convex/values";
import { sessionStatusValidator } from "../validators";

export const sessionValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  branchName: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  ptySessionId: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
  status: sessionStatusValidator,
  archived: v.optional(v.boolean()),
  summary: v.optional(v.array(v.string())),
  createdBy: v.optional(v.id("users")),
  planContent: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  devPort: v.optional(v.number()),
  devCommand: v.optional(v.string()),
});
