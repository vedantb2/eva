import { createFileRoute } from "@tanstack/react-router";
import { SkillsClient } from "./SkillsClient";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/skills")({
  component: SkillsClient,
});
