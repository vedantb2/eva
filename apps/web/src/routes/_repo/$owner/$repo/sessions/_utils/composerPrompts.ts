/**
 * Prompts that read-only surfaces (PRD plan view, design preview) hand to the
 * chat composer. Modes are gone, so "approve" / "use this" now mean "seed the
 * next message" rather than flipping the session into another mode.
 */

/** Seeded when the user approves a generated plan. */
export const APPROVE_PLAN_PROMPT = "Implement the approved plan from plan.md.";

/** Seeded when the user picks one of the design preview's variations. */
export function designVariationPrompt(letter: string, label: string): string {
  return `Implement variation ${letter} ("${label}") from the design preview.`;
}
