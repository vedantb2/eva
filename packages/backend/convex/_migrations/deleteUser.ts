import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
// Delete a user and all their data
//
// Run `migrations.deleteUserAndAllData` from the Convex dashboard with
// { "userId": "<id>" }. It schedules a step pipeline (mirroring deleteRepos.ts)
// that walks every table touching the user. Two categories:
//
//   • OWNED data (sessions, design sessions, projects, annotations,
//     notifications, queued messages, personas, uploaded config files,
//     automations, personal team, memberships) is hard-deleted with its full
//     child cascade.
//   • SHARED/contributor references (tasks/comments/messages the user touched on
//     repos or teams others use, repo `connectedBy`, project lead/member links,
//     doc interview history) have the optional user link nullified — the row is
//     kept so other users' data survives.
//
// Clerk is NOT touched: this purges Convex documents only.
//
// The `users` row is deleted last, so a mid-pipeline failure leaves the user
// resolvable and the whole run can simply be re-triggered (it is idempotent).
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  "ownedSessions",
  "ownedDesignSessions",
  "ownedProjects",
  "ownedSimple",
  "teams",
  "ownedAutomations",
  "designPersonas",
  "sandboxConfigFiles",
  "queuedMessages",
  "nullifyTasks",
  "nullifyMessages",
  "nullifyTaskComments",
  "nullifyTaskActivity",
  "nullifySessionsCreatedBy",
  "nullifyRepos",
  "nullifyProjectMembers",
  "nullifyDocs",
  "mcpAuthCodes",
  "user",
] as const;

type Step = (typeof STEPS)[number];

const stepValidator = v.union(
  v.literal("ownedSessions"),
  v.literal("ownedDesignSessions"),
  v.literal("ownedProjects"),
  v.literal("ownedSimple"),
  v.literal("teams"),
  v.literal("ownedAutomations"),
  v.literal("designPersonas"),
  v.literal("sandboxConfigFiles"),
  v.literal("queuedMessages"),
  v.literal("nullifyTasks"),
  v.literal("nullifyMessages"),
  v.literal("nullifyTaskComments"),
  v.literal("nullifyTaskActivity"),
  v.literal("nullifySessionsCreatedBy"),
  v.literal("nullifyRepos"),
  v.literal("nullifyProjectMembers"),
  v.literal("nullifyDocs"),
  v.literal("mcpAuthCodes"),
  v.literal("user"),
);

/** Returns the next step in the ordered pipeline, or null when finished. */
function nextStep(current: Step): Step | null {
  const idx = STEPS.indexOf(current);
  if (idx === -1 || idx === STEPS.length - 1) return null;
  return STEPS[idx + 1];
}

// Number of rows to scan per page on the unindexed full-table-scan steps.
const PAGE_SIZE = 500;
// Smaller pages where each row may delete storage blobs (more work per row).
const STORAGE_PAGE_SIZE = 200;

// A parent that can own chat messages (see messages.parentId / queuedMessages).
type MessageParent =
  | Id<"sessions">
  | Id<"designSessions">
  | Id<"projects">
  | Id<"agentTasks">;

// ─────────────────────────────────────────────────────────────────────────────
// Cascade helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Deletes a message row plus any image/video storage blobs it references. */
async function deleteMessage(
  ctx: MutationCtx,
  message: Doc<"messages">,
): Promise<void> {
  if (message.imageStorageId) await ctx.storage.delete(message.imageStorageId);
  if (message.videoStorageId) await ctx.storage.delete(message.videoStorageId);
  await ctx.db.delete(message._id);
}

/** Deletes all messages + queued messages attached to a parent. Returns count. */
async function deleteParentMessages(
  ctx: MutationCtx,
  parentId: MessageParent,
): Promise<number> {
  let deleted = 0;
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
  for (const message of messages) {
    await deleteMessage(ctx, message);
    deleted++;
  }
  const queued = await ctx.db
    .query("queuedMessages")
    .withIndex("by_parent_and_created", (q) => q.eq("parentId", parentId))
    .collect();
  for (const q of queued) {
    await ctx.db.delete(q._id);
    deleted++;
  }
  return deleted;
}

/** Deletes a task and every child row that hangs off it. Returns count. */
async function deleteTaskCascade(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<number> {
  let deleted = 0;

  const runs = await ctx.db
    .query("agentRuns")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const run of runs) {
    const logs = await ctx.db
      .query("agentRunActivityLogs")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
      deleted++;
    }
    await ctx.db.delete(run._id);
    deleted++;
  }

  const comments = await ctx.db
    .query("taskComments")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const comment of comments) {
    await ctx.db.delete(comment._id);
    deleted++;
  }

  const proofs = await ctx.db
    .query("taskProof")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const proof of proofs) {
    if (proof.storageId) await ctx.storage.delete(proof.storageId);
    await ctx.db.delete(proof._id);
    deleted++;
  }

  const deps = await ctx.db
    .query("taskDependencies")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const dep of deps) {
    await ctx.db.delete(dep._id);
    deleted++;
  }
  const reverseDeps = await ctx.db
    .query("taskDependencies")
    .withIndex("by_dependency", (q) => q.eq("dependsOnId", taskId))
    .collect();
  for (const dep of reverseDeps) {
    await ctx.db.delete(dep._id);
    deleted++;
  }

  const audits = await ctx.db
    .query("audits")
    .withIndex("by_entity", (q) => q.eq("entityId", taskId))
    .collect();
  for (const audit of audits) {
    await ctx.db.delete(audit._id);
    deleted++;
  }

  const streaming = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", String(taskId)))
    .collect();
  for (const row of streaming) {
    await ctx.db.delete(row._id);
    deleted++;
  }

  const sandboxEvents = await ctx.db
    .query("taskSandboxEvents")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const event of sandboxEvents) {
    await ctx.db.delete(event._id);
    deleted++;
  }

  const activity = await ctx.db
    .query("taskActivity")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  for (const row of activity) {
    await ctx.db.delete(row._id);
    deleted++;
  }

  deleted += await deleteParentMessages(ctx, taskId);

  await ctx.db.delete(taskId);
  deleted++;
  return deleted;
}

/** Reassigns ownership of a kept team to an heir, or deletes it if none remain. */
async function reassignOrDeleteTeam(
  ctx: MutationCtx,
  team: Doc<"teams">,
): Promise<number> {
  const remaining = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", team._id))
    .collect();
  const heir = remaining.find((m) => m.role === "owner") ?? remaining[0];
  if (heir) {
    await ctx.db.patch(team._id, { createdBy: heir.userId });
    return 0;
  }
  await ctx.db.delete(team._id);
  return 1;
}

/** Deletes a personal team along with its members and env vars. Returns count. */
async function deletePersonalTeam(
  ctx: MutationCtx,
  teamId: Id<"teams">,
): Promise<number> {
  let deleted = 0;
  const members = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();
  for (const member of members) {
    await ctx.db.delete(member._id);
    deleted++;
  }
  const envVars = await ctx.db
    .query("teamEnvVars")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();
  for (const ev of envVars) {
    await ctx.db.delete(ev._id);
    deleted++;
  }
  await ctx.db.delete(teamId);
  deleted++;
  return deleted;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline entry point
// ─────────────────────────────────────────────────────────────────────────────

/** Kicks off deletion of a user and all of their data. Idempotent: a no-op if
 *  the user is already gone. */
export const deleteUserAndAllData = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ scheduled: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      console.log(`[deleteUser] ${userId}: user not found, nothing to do`);
      return { scheduled: false };
    }
    const label = user.email ?? user.fullName ?? String(userId);
    console.log(`[deleteUser] ${label}: starting full deletion`);
    await ctx.scheduler.runAfter(0, internal.migrations.deleteUserStep, {
      userId,
      step: STEPS[0],
      totalDeleted: 0,
      label,
      clerkId: user.clerkId ?? null,
      cursor: null,
    });
    return { scheduled: true };
  },
});

/** Executes one step of the user-deletion pipeline and schedules the next.
 *  Scan-heavy steps page through their table, re-scheduling the same step with
 *  the continuation cursor until the table is exhausted. */
export const deleteUserStep = internalMutation({
  args: {
    userId: v.id("users"),
    step: stepValidator,
    totalDeleted: v.number(),
    label: v.string(),
    clerkId: v.union(v.string(), v.null()),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { userId, step, totalDeleted, label, clerkId, cursor },
  ) => {
    let deleted = 0;
    // When set to a string, the current step has more pages and is re-run with
    // this cursor. null means the step is finished and the pipeline advances.
    let repeatCursor: string | null = null;

    switch (step) {
      case "ownedSessions": {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        for (const session of sessions) {
          deleted += await deleteParentMessages(ctx, session._id);
          const audits = await ctx.db
            .query("audits")
            .withIndex("by_entity", (q) => q.eq("entityId", session._id))
            .collect();
          for (const audit of audits) {
            await ctx.db.delete(audit._id);
            deleted++;
          }
          const streaming = await ctx.db
            .query("streamingActivity")
            .withIndex("by_entity", (q) =>
              q.eq("entityId", String(session._id)),
            )
            .collect();
          for (const row of streaming) {
            await ctx.db.delete(row._id);
            deleted++;
          }
          await ctx.db.delete(session._id);
          deleted++;
        }
        break;
      }

      case "ownedDesignSessions": {
        const designSessions = await ctx.db
          .query("designSessions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        for (const ds of designSessions) {
          deleted += await deleteParentMessages(ctx, ds._id);
          await ctx.db.delete(ds._id);
          deleted++;
        }
        break;
      }

      case "ownedProjects": {
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        for (const project of projects) {
          const details = await ctx.db
            .query("projectDetails")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();
          for (const d of details) {
            await ctx.db.delete(d._id);
            deleted++;
          }
          const tasks = await ctx.db
            .query("agentTasks")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();
          for (const task of tasks) {
            deleted += await deleteTaskCascade(ctx, task._id);
          }
          const logs = await ctx.db
            .query("logs")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();
          for (const log of logs) {
            await ctx.db.delete(log._id);
            deleted++;
          }
          deleted += await deleteParentMessages(ctx, project._id);
          await ctx.db.delete(project._id);
          deleted++;
        }
        break;
      }

      case "ownedSimple": {
        const annotations = await ctx.db
          .query("annotations")
          .withIndex("by_user_and_url", (q) => q.eq("userId", userId))
          .collect();
        for (const annotation of annotations) {
          await ctx.db.delete(annotation._id);
          deleted++;
        }
        const notifications = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        for (const notification of notifications) {
          await ctx.db.delete(notification._id);
          deleted++;
        }
        break;
      }

      case "teams": {
        // Memberships first: leave shared teams intact, delete personal ones.
        const memberships = await ctx.db
          .query("teamMembers")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        for (const membership of memberships) {
          const team = await ctx.db.get(membership.teamId);
          if (team && team.isPersonal && team.createdBy === userId) {
            deleted += await deletePersonalTeam(ctx, team._id);
            continue;
          }
          await ctx.db.delete(membership._id);
          deleted++;
          if (team && team.createdBy === userId) {
            deleted += await reassignOrDeleteTeam(ctx, team);
          }
        }
        // Teams the user founded but is not a member of.
        const ownedTeams = await ctx.db
          .query("teams")
          .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
          .collect();
        for (const team of ownedTeams) {
          if (team.isPersonal) {
            deleted += await deletePersonalTeam(ctx, team._id);
          } else {
            deleted += await reassignOrDeleteTeam(ctx, team);
          }
        }
        break;
      }

      case "ownedAutomations": {
        // automations.createdBy is required (cannot be nullified), so an
        // automation belongs to its creator — delete it with its runs.
        const page = await ctx.db
          .query("automations")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const automation of page.page) {
          if (automation.createdBy !== userId) continue;
          const runs = await ctx.db
            .query("automationRuns")
            .withIndex("by_automation", (q) =>
              q.eq("automationId", automation._id),
            )
            .collect();
          for (const run of runs) {
            await ctx.db.delete(run._id);
            deleted++;
          }
          await ctx.db.delete(automation._id);
          deleted++;
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "designPersonas": {
        const page = await ctx.db
          .query("designPersonas")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const persona of page.page) {
          if (persona.userId === userId) {
            await ctx.db.delete(persona._id);
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "sandboxConfigFiles": {
        const page = await ctx.db
          .query("sandboxConfigFiles")
          .paginate({ cursor, numItems: STORAGE_PAGE_SIZE });
        for (const file of page.page) {
          if (file.uploadedBy !== userId) continue;
          if (file.storageId) await ctx.storage.delete(file.storageId);
          if (file.chunks) {
            for (const chunk of file.chunks) await ctx.storage.delete(chunk);
          }
          await ctx.db.delete(file._id);
          deleted++;
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "queuedMessages": {
        // Queued messages on owned parents are already gone; this catches the
        // user's queued messages left on shared sessions/tasks.
        const page = await ctx.db
          .query("queuedMessages")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const queued of page.page) {
          if (queued.userId === userId) {
            await ctx.db.delete(queued._id);
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifyTasks": {
        const page = await ctx.db
          .query("agentTasks")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const task of page.page) {
          const createdMatch = task.createdBy === userId;
          const assignedMatch = task.assignedTo === userId;
          if (createdMatch || assignedMatch) {
            await ctx.db.patch(task._id, {
              createdBy: createdMatch ? undefined : task.createdBy,
              assignedTo: assignedMatch ? undefined : task.assignedTo,
            });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifyMessages": {
        const page = await ctx.db
          .query("messages")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const message of page.page) {
          if (message.userId === userId) {
            await ctx.db.patch(message._id, { userId: undefined });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifyTaskComments": {
        const page = await ctx.db
          .query("taskComments")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const comment of page.page) {
          if (comment.authorId === userId) {
            await ctx.db.patch(comment._id, { authorId: undefined });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifyTaskActivity": {
        const page = await ctx.db
          .query("taskActivity")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const row of page.page) {
          if (row.userId === userId) {
            await ctx.db.patch(row._id, { userId: undefined });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifySessionsCreatedBy": {
        // Owned sessions (userId) are already deleted; this catches sessions
        // someone else owns that the user created on their behalf.
        const page = await ctx.db
          .query("sessions")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const session of page.page) {
          if (session.createdBy === userId) {
            await ctx.db.patch(session._id, { createdBy: undefined });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifyRepos": {
        const page = await ctx.db
          .query("githubRepos")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const repo of page.page) {
          if (repo.connectedBy === userId) {
            await ctx.db.patch(repo._id, { connectedBy: undefined });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifyProjectMembers": {
        // Owned projects are already deleted; this catches projects others own
        // where the user is the lead or a member.
        const page = await ctx.db
          .query("projects")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const project of page.page) {
          const leadMatch = project.projectLead === userId;
          const memberMatch = project.members?.includes(userId) ?? false;
          if (leadMatch || memberMatch) {
            await ctx.db.patch(project._id, {
              projectLead: leadMatch ? undefined : project.projectLead,
              members: memberMatch
                ? project.members?.filter((id) => id !== userId)
                : project.members,
            });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "nullifyDocs": {
        const page = await ctx.db
          .query("docs")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const doc of page.page) {
          if (!doc.interviewHistory) continue;
          let changed = false;
          const history = doc.interviewHistory.map((entry) => {
            if (entry.userId === userId) {
              changed = true;
              return { ...entry, userId: undefined };
            }
            return entry;
          });
          if (changed) {
            await ctx.db.patch(doc._id, { interviewHistory: history });
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "mcpAuthCodes": {
        if (clerkId === null) break;
        const page = await ctx.db
          .query("mcpAuthCodes")
          .paginate({ cursor, numItems: PAGE_SIZE });
        for (const code of page.page) {
          if (code.clerkUserId === clerkId) {
            await ctx.db.delete(code._id);
            deleted++;
          }
        }
        repeatCursor = page.isDone ? null : page.continueCursor;
        break;
      }

      case "user": {
        const user = await ctx.db.get(userId);
        if (user) {
          await ctx.db.delete(userId);
          deleted++;
        }
        break;
      }
    }

    const running = totalDeleted + deleted;

    if (repeatCursor !== null) {
      await ctx.scheduler.runAfter(0, internal.migrations.deleteUserStep, {
        userId,
        step,
        totalDeleted: running,
        label,
        clerkId,
        cursor: repeatCursor,
      });
      return null;
    }

    console.log(
      `[deleteUser] ${label}: step "${step}" — affected ${deleted} (running total: ${running})`,
    );

    const next = nextStep(step);
    if (next) {
      await ctx.scheduler.runAfter(0, internal.migrations.deleteUserStep, {
        userId,
        step: next,
        totalDeleted: running,
        label,
        clerkId,
        cursor: null,
      });
    } else {
      console.log(
        `[deleteUser] ${label}: COMPLETE — ${running} documents affected`,
      );
    }
    return null;
  },
});
