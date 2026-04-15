import { v } from "convex/values";
import type {
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import { projectFields, conversationMessageValidator } from "../validators";
import type { DataModel } from "../_generated/dataModel";
import type { Id, Doc } from "../_generated/dataModel";

type ConversationMessage = Doc<"projectDetails">["conversationHistory"][number];

/** Builds a git branch name for a project, optionally versioned. */
export function buildProjectBranchName(
  projectId: Id<"projects">,
  branchVersion?: number,
): string {
  const version = branchVersion ?? 1;
  if (version <= 1) {
    return `eva/project-${projectId}`;
  }
  return `eva/project-${projectId}-v${version}`;
}

/** Convex validator for a project document with its conversation history and generated spec. */
export const projectWithDetailsValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  ...projectFields,
  generatedSpec: v.optional(v.string()),
  conversationHistory: v.array(conversationMessageValidator),
});

const {
  conversationHistory: _ch,
  generatedSpec: _gs,
  ...projectSummaryFields
} = projectWithDetailsValidator.fields;
/** Convex validator for a project summary (excludes conversation history and generated spec). */
export const projectSummaryValidator = v.object(projectSummaryFields);

/** Fetches the projectDetails document for a given project. */
export async function getProjectDetails(
  db: GenericDatabaseReader<DataModel>,
  projectId: Id<"projects">,
): Promise<Doc<"projectDetails"> | null> {
  return await db
    .query("projectDetails")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .first();
}

/** Returns the conversation history for a project, or an empty array if none exists. */
export async function getProjectConversation(
  db: GenericDatabaseReader<DataModel>,
  projectId: Id<"projects">,
): Promise<Array<ConversationMessage>> {
  const details = await getProjectDetails(db, projectId);
  return details?.conversationHistory ?? [];
}

/** Returns the generated spec JSON string for a project, or undefined if none exists. */
export async function getProjectGeneratedSpec(
  db: GenericDatabaseReader<DataModel>,
  projectId: Id<"projects">,
): Promise<string | undefined> {
  const details = await getProjectDetails(db, projectId);
  return details?.generatedSpec;
}

/** Creates or updates the conversation history for a project. */
export async function setProjectConversation(
  db: GenericDatabaseWriter<DataModel>,
  projectId: Id<"projects">,
  conversationHistory: Array<ConversationMessage>,
): Promise<void> {
  const existing = await db
    .query("projectDetails")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .first();
  if (existing) {
    await db.patch(existing._id, { conversationHistory });
  } else {
    await db.insert("projectDetails", { projectId, conversationHistory });
  }
}

/** Creates or updates the generated spec for a project. */
export async function setProjectGeneratedSpec(
  db: GenericDatabaseWriter<DataModel>,
  projectId: Id<"projects">,
  generatedSpec: string,
): Promise<void> {
  const existing = await db
    .query("projectDetails")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .first();
  if (existing) {
    await db.patch(existing._id, { generatedSpec });
  } else {
    await db.insert("projectDetails", {
      projectId,
      conversationHistory: [],
      generatedSpec,
    });
  }
}

/** Deletes the projectDetails document for a given project. */
export async function deleteProjectDetails(
  db: GenericDatabaseWriter<DataModel>,
  projectId: Id<"projects">,
): Promise<void> {
  const existing = await db
    .query("projectDetails")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .first();
  if (existing) {
    await db.delete(existing._id);
  }
}

interface ParsedTask {
  title: string;
  description: string;
  dependencies: number[];
}

interface ParsedSpec {
  title: string;
  description: string;
  tasks: ParsedTask[];
}

/** Parses a JSON spec string into a structured object with title, description, and tasks. */
export function parseSpec(specJson: string): ParsedSpec {
  const parsed = JSON.parse(specJson);
  return {
    title: parsed.title ?? "",
    description: parsed.description ?? "",
    tasks: (parsed.tasks ?? []).map(
      (t: {
        title?: string;
        description?: string;
        dependencies?: number[];
      }) => ({
        title: t.title ?? "",
        description: t.description ?? "",
        dependencies: t.dependencies ?? [],
      }),
    ),
  };
}
