import { z } from "zod";
import type { AIProvider } from "../_validators/aiModels";
import { AI_PROVIDERS } from "../_validators/aiModels";
import type { ReportedHarnessCommand } from "./filter";

/**
 * The message a sandbox signs to prove it may report a harness catalog. Scoped
 * per provider so the injected signature is useless against any other endpoint
 * (the streaming heartbeat signs a bare entity id) or another provider's row.
 * Both sides key it with `ENCRYPTION_KEY`, so rotation = rotating that key.
 */
export function harnessCatalogHmacMessage(provider: string): string {
  return "harness-catalog:" + provider;
}

/** Caps that keep a compromised signature from writing an unbounded row. */
const MAX_COMMANDS = 100;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_ARGUMENT_HINT_LENGTH = 400;
const MAX_CLI_VERSION_LENGTH = 64;
const MAX_SKILLS_JSON_LENGTH = 200_000;

const commandsSchema = z
  .array(
    z.object({
      name: z.string().min(1).max(MAX_NAME_LENGTH),
      description: z.string().max(MAX_DESCRIPTION_LENGTH),
      argumentHint: z.string().max(MAX_ARGUMENT_HINT_LENGTH).optional(),
    }),
  )
  .min(1)
  .max(MAX_COMMANDS);

const fieldsSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  cliVersion: z.string().min(1).max(MAX_CLI_VERSION_LENGTH),
  skillsJson: z.string().min(1).max(MAX_SKILLS_JSON_LENGTH),
});

export interface HarnessCatalogReport {
  provider: AIProvider;
  cliVersion: string;
  commands: ReportedHarnessCommand[];
}

/** Decodes the JSON command list, treating unparseable input as malformed. */
function decodeCommands(skillsJson: string): ReportedHarnessCommand[] | null {
  try {
    const parsed = commandsSchema.safeParse(JSON.parse(skillsJson));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Parses the form fields of a catalog report at the HTTP boundary. Returns null
 * for anything malformed so the route answers 400 instead of throwing into the
 * mutation. The mutation's own filter still runs as defense in depth.
 */
export function parseHarnessCatalogReport(fields: {
  provider: string | null;
  cliVersion: string | null;
  skillsJson: string | null;
}): HarnessCatalogReport | null {
  const parsed = fieldsSchema.safeParse(fields);
  if (!parsed.success) return null;
  const commands = decodeCommands(parsed.data.skillsJson);
  if (!commands) return null;
  return {
    provider: parsed.data.provider,
    cliVersion: parsed.data.cliVersion,
    commands,
  };
}
