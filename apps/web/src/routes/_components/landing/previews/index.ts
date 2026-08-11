import type { ComponentType } from "react";
import type { LandingPreviewKey } from "../landingContent";
import {
  DocumentsPreview,
  DraftsPreview,
  ProjectsPreview,
} from "./PlanPreviews";
import {
  AgentsPreview,
  QuickTasksPreview,
  SessionsPreview,
} from "./BuildPreviews";
import { ArenaPreview, ReviewsPreview } from "./VerifyPreviews";
import {
  AutomationsPreview,
  SkillsPreview,
  SnapshotsPreview,
} from "./OperatePreviews";
import { InboxPreview, StatsPreview, TeamsPreview } from "./WorkspacePreviews";

/**
 * Every feature's mock panel, keyed by the closed `LandingPreviewKey` union. An
 * exhaustive record means a new feature cannot ship with an empty panel — the
 * missing key is a type error here.
 */
export const LANDING_PREVIEWS: Record<LandingPreviewKey, ComponentType> = {
  documents: DocumentsPreview,
  projects: ProjectsPreview,
  drafts: DraftsPreview,
  sessions: SessionsPreview,
  quickTasks: QuickTasksPreview,
  agents: AgentsPreview,
  reviews: ReviewsPreview,
  arena: ArenaPreview,
  automations: AutomationsPreview,
  snapshots: SnapshotsPreview,
  skills: SkillsPreview,
  stats: StatsPreview,
  inbox: InboxPreview,
  teams: TeamsPreview,
};
