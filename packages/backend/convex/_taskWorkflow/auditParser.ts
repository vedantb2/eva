import { z } from "zod";

type AuditSeverity = "critical" | "high" | "medium" | "low";
type EvalResult = {
  requirement: string;
  passed: boolean;
  detail: string;
  severity?: AuditSeverity;
};
type AuditSection = { name: string; results: EvalResult[] };

// Boundary schemas for the LLM audit JSON. Invalid results and sections are
// dropped (`.catch(null)` + filter); an unrecognised severity falls back to
// "medium" and a missing summary to a default — matching the previous
// hand-rolled parsing behaviour exactly.
const severitySchema = z
  .enum(["critical", "high", "medium", "low"])
  .catch("medium");

const evalResultSchema = z.object({
  requirement: z.string(),
  passed: z.boolean(),
  detail: z.string(),
  severity: severitySchema,
});

const auditSectionSchema = z.object({
  name: z.string(),
  results: z.array(evalResultSchema.nullable().catch(null)),
});

const auditRootSchema = z.object({
  sections: z.array(auditSectionSchema.nullable().catch(null)).catch([]),
  summary: z.string().catch("Audit completed"),
});

/** Parses raw JSON into structured audit sections with validated results. */
export function parseSectionsFromJson(raw: unknown): AuditSection[] {
  const parsed = auditRootSchema.safeParse(raw);
  if (!parsed.success) return [];

  const sections: AuditSection[] = [];
  for (const section of parsed.data.sections) {
    if (!section) continue;
    sections.push({
      name: section.name,
      results: section.results.flatMap((r) => (r ? [r] : [])),
    });
  }
  return sections;
}

/** Extracts the summary string from parsed audit JSON, with a fallback default. */
export function extractSummaryFromJson(raw: unknown): string {
  const parsed = auditRootSchema.safeParse(raw);
  if (!parsed.success) return "Audit completed";
  return parsed.data.summary;
}

/** Collects all failed audit results across sections into a flat list of failures. */
export function extractFailuresFromJson(
  raw: unknown,
): Array<{ section: string; requirement: string; detail: string }> {
  const sections = parseSectionsFromJson(raw);
  const failures: Array<{
    section: string;
    requirement: string;
    detail: string;
  }> = [];

  for (const section of sections) {
    for (const item of section.results) {
      if (!item.passed) {
        failures.push({
          section: section.name,
          requirement: item.requirement,
          detail: item.detail,
        });
      }
    }
  }

  return failures;
}
