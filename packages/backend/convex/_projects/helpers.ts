import { v } from "convex/values";
import { roleValidator, phaseValidator } from "../validators";

export const conversationMessageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
});

export const projectValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.optional(v.string()),
  baseBranch: v.optional(v.string()),
  prUrl: v.optional(v.string()),
  sandboxId: v.optional(v.string()),
  lastSandboxActivity: v.optional(v.number()),
  phase: phaseValidator,
  rawInput: v.string(),
  generatedSpec: v.optional(v.string()),
  conversationHistory: v.array(conversationMessageValidator),
  projectLead: v.optional(v.id("users")),
  members: v.optional(v.array(v.id("users"))),
  projectStartDate: v.optional(v.number()),
  projectEndDate: v.optional(v.number()),
  deadline: v.optional(v.number()),
  activeWorkflowId: v.optional(v.string()),
  activeBuildWorkflowId: v.optional(v.string()),
  scheduledBuildAt: v.optional(v.number()),
  scheduledBuildFunctionId: v.optional(v.id("_scheduled_functions")),
});

const {
  conversationHistory: _ch,
  generatedSpec: _gs,
  ...projectSummaryFields
} = projectValidator.fields;
export const projectSummaryValidator = v.object(projectSummaryFields);

export const AUDIT_TASKS = [
  {
    title: "Accessibility Audit",
    description:
      "Review all changes for WCAG 2.2 compliance (https://www.w3.org/TR/WCAG22/). Check semantic HTML, ARIA attributes, keyboard navigation, color contrast, focus management, and screen reader support.",
    subtasks: [
      "Check semantic HTML elements and landmark regions",
      "Verify ARIA attributes and roles are correct",
      "Check form labels, error messages, and input associations",
      "Verify images have appropriate alt text",
    ],
  },
  {
    title: "Testing Audit",
    description:
      "Review all diffs in the branch/PR and verify that tests are correct, complete, and aligned with the project requirements. Check test coverage, edge cases, assertions, and that tests actually validate the described behavior.",
    subtasks: [
      "Verify tests exist for all new/changed functionality",
      "Check test assertions match the project requirements",
      "Validate edge cases and error paths are covered",
      "Ensure tests are not trivially passing (false positives)",
      "Check mocks and test data are realistic",
    ],
  },
];

interface ParsedTask {
  title: string;
  description: string;
  dependencies: number[];
  subtasks: string[];
}

interface ParsedSpec {
  title: string;
  description: string;
  tasks: ParsedTask[];
}

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
        subtasks?: string[];
      }) => ({
        title: t.title ?? "",
        description: t.description ?? "",
        dependencies: t.dependencies ?? [],
        subtasks: t.subtasks ?? [],
      }),
    ),
  };
}
