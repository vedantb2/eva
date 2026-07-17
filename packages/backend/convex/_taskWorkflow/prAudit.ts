import { z } from "zod";
import { extractJsonBlock } from "./helpers";

const auditRowSchema = z.object({
  requirement: z.string(),
  passed: z.boolean(),
  detail: z.string(),
});

const parsedAuditSchema = z.object({
  sections: z
    .array(
      z.object({
        name: z.string(),
        results: z.array(auditRowSchema).optional(),
      }),
    )
    .optional(),
  accessibility: z.array(auditRowSchema).optional(),
  testing: z.array(auditRowSchema).optional(),
  codeReview: z.array(auditRowSchema).optional(),
  summary: z.string().optional(),
});

type AuditRow = z.infer<typeof auditRowSchema>;

export const AUDIT_SECTION_REGEX =
  /<!-- EVA_AUDIT_START -->[\s\S]*?<!-- EVA_AUDIT_END -->\s*/m;

/** Escapes pipe characters and newlines so a string is safe for a markdown table cell. */
export function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

/** Builds the markdown audit section from parsed audit results or an error message. */
export function buildAuditSection(
  result: string | null,
  error: string | null,
): string {
  const lines: string[] = [
    "<!-- EVA_AUDIT_START -->",
    "## Post-Execution Audit",
    "",
  ];

  if (error) {
    lines.push(`Audit failed: ${escapeTableCell(error)}`);
    lines.push("<!-- EVA_AUDIT_END -->");
    return lines.join("\n");
  }

  if (!result) {
    lines.push("Audit unavailable.");
    lines.push("<!-- EVA_AUDIT_END -->");
    return lines.join("\n");
  }

  try {
    const parsed = parsedAuditSchema.parse(
      JSON.parse(extractJsonBlock(result)),
    );
    const rows: Array<[string, AuditRow]> = [];

    if (parsed.sections && Array.isArray(parsed.sections)) {
      for (const section of parsed.sections) {
        for (const row of section.results ?? []) {
          rows.push([section.name, row]);
        }
      }
    } else {
      for (const row of parsed.accessibility ?? [])
        rows.push(["Accessibility", row]);
      for (const row of parsed.testing ?? []) rows.push(["Testing", row]);
      for (const row of parsed.codeReview ?? [])
        rows.push(["Code Review", row]);
    }

    if (parsed.summary) {
      lines.push(`Summary: ${escapeTableCell(parsed.summary)}`);
      lines.push("");
    }

    lines.push("| Section | Requirement | Passed | Detail |");
    lines.push("| --- | --- | --- | --- |");

    if (rows.length === 0) {
      lines.push("| - | - | - | No audit checks returned |");
    } else {
      for (const [section, row] of rows) {
        const status = row.passed ? "PASS" : "FAIL";
        lines.push(
          `| ${section} | ${escapeTableCell(row.requirement)} | ${status} | ${escapeTableCell(row.detail)} |`,
        );
      }
    }
  } catch {
    lines.push("Audit parsing failed.");
  }

  lines.push("<!-- EVA_AUDIT_END -->");
  return lines.join("\n");
}

/** Merges a new audit section into an existing PR body, replacing any previous audit block. */
export function mergeBodyWithAuditSection(
  existingBody: string,
  auditSection: string,
): string {
  const stripped = existingBody.replace(AUDIT_SECTION_REGEX, "").trim();
  return stripped ? `${stripped}\n\n${auditSection}` : auditSection;
}
