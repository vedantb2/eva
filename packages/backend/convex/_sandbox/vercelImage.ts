import { z } from "zod";

/**
 * Which base image a *fresh* (non-snapshot) Vercel sandbox boots from.
 *
 * eva has always used `runtime: "node24"` — Amazon Linux 2023. `@vercel/sandbox`
 * v3 deprecates `runtime` in favour of Managed Images (`image:
 * "vercel/sandbox/<name>"`), which are Ubuntu-based. The two facts that decide
 * whether the flip is safe — the container user/`$HOME` and whether Ubuntu's
 * package names cover eva's toolchain — can only be settled by a live run
 * (see scripts/vercel-sandbox-spike/MANAGED-IMAGE-RESULTS.md), so the flip is
 * behind an env var and still defaults to AL2023.
 *
 * Snapshot restores never pass either property (Vercel forbids it on the
 * snapshot source), so this only affects sandboxes with no seeded snapshot yet.
 *
 * Set `VERCEL_SANDBOX_IMAGE` in the Convex deployment env to flip:
 *   - unset / `node24`         → `{ runtime: "node24" }` (today's behaviour)
 *   - `universal`, `ubuntu`, … → `{ image: "vercel/sandbox/universal" }`
 *   - `vercel/sandbox/universal:2026.01` → passed through verbatim (tag/digest)
 */

/** Managed image short names Vercel publishes under `vercel/sandbox/`. */
const MANAGED_IMAGE_NAMES: readonly string[] = [
  "universal",
  "node:22",
  "node:24",
  "node:26",
  "python:3.14",
  "ubuntu",
  "arch",
];

const MANAGED_IMAGE_PREFIX = "vercel/sandbox/";

/** Legacy value meaning "keep the deprecated AL2023 runtime". */
const LEGACY_RUNTIME = "node24";

/** What `Sandbox.create` accepts for a fresh sandbox: one property, never both. */
export type VercelSandboxSource =
  | { runtime: "node24"; image?: never }
  | { image: string; runtime?: never };

const imageSettingSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      value === LEGACY_RUNTIME ||
      value.startsWith(MANAGED_IMAGE_PREFIX) ||
      MANAGED_IMAGE_NAMES.includes(value),
    {
      message: `must be "${LEGACY_RUNTIME}", a managed image name (${MANAGED_IMAGE_NAMES.join(", ")}), or a full "${MANAGED_IMAGE_PREFIX}…" reference`,
    },
  );

/**
 * Resolves the create-time source for a fresh sandbox.
 *
 * Throws on an unrecognised value rather than silently falling back: a typo'd
 * image name would otherwise boot every sandbox on the wrong distro, and the
 * toolchain failure that follows is far harder to attribute than a create error.
 */
export function resolveVercelSandboxSource(
  setting: string | undefined = process.env.VERCEL_SANDBOX_IMAGE,
): VercelSandboxSource {
  if (setting === undefined || setting.trim() === "") {
    return { runtime: LEGACY_RUNTIME };
  }
  const parsed = imageSettingSchema.safeParse(setting);
  if (!parsed.success) {
    throw new Error(
      `VERCEL_SANDBOX_IMAGE="${setting}" is not valid: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  const value = parsed.data;
  if (value === LEGACY_RUNTIME) {
    return { runtime: LEGACY_RUNTIME };
  }
  return {
    image: value.startsWith(MANAGED_IMAGE_PREFIX)
      ? value
      : `${MANAGED_IMAGE_PREFIX}${value}`,
  };
}

/** Human-readable label for create logs / error messages. */
export function describeVercelSandboxSource(
  source: VercelSandboxSource,
): string {
  return "image" in source && source.image !== undefined
    ? `image=${source.image}`
    : `runtime=${LEGACY_RUNTIME}`;
}
