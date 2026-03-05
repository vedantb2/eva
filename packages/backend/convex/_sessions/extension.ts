import { v } from "convex/values";
import { authMutation } from "../functions";
import { roleValidator } from "../validators";

export const getOrCreateExtensionSession = authMutation({
  args: {
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    id: v.string(),
    repoId: v.string(),
    messages: v.array(
      v.object({
        role: roleValidator,
        content: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_repo_and_status", (q) =>
        q.eq("repoId", args.repoId).eq("status", "active"),
      )
      .collect();
    const existingSession = activeSessions.find(
      (s) =>
        s.userId === ctx.userId &&
        s.title === "Extension Session" &&
        s.archived !== true,
    );

    if (existingSession) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", existingSession._id))
        .collect();
      return {
        id: existingSession._id,
        repoId: existingSession.repoId,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
    }

    const sessionId = await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: "Extension Session",
      status: "active",
      updatedAt: Date.now(),
    });
    await ctx.db.patch(sessionId, {
      branchName: `session/${sessionId}`,
    });

    return {
      id: sessionId,
      repoId: args.repoId,
      messages: [],
    };
  },
});
