import { VercelLogo } from "@/lib/components/ui/providerLogos";
import type { EnvVarSlotEntry } from "./envVarSlotTypes";

/**
 * Sandbox infrastructure secrets surfaced as first-class paste-in slots.
 * Token and team id are typically team-level; project id must be per app repo.
 */
export const INFRA_ENV_VARS: ReadonlyArray<EnvVarSlotEntry> = [
  {
    id: "vercel-token",
    label: "Vercel token",
    primaryKey: "VERCEL_TOKEN",
    matchKeys: ["VERCEL_TOKEN"],
    Logo: VercelLogo,
    hint: "Vercel access token. Shared at team level; inherited by all repos.",
    placeholder: "...",
    multiline: false,
  },
  {
    id: "vercel-team",
    label: "Vercel team",
    primaryKey: "VERCEL_TEAM_ID",
    matchKeys: ["VERCEL_TEAM_ID"],
    Logo: VercelLogo,
    hint: "Vercel team id (team_...). Shared at team level.",
    placeholder: "team_...",
    multiline: false,
  },
  {
    id: "vercel-project",
    label: "Vercel project",
    primaryKey: "VERCEL_PROJECT_ID",
    matchKeys: ["VERCEL_PROJECT_ID"],
    Logo: VercelLogo,
    hint: "Vercel project id for this app. Must be set per repo — not at team level.",
    placeholder: "prj_...",
    multiline: false,
    repoOnly: true,
  },
];
