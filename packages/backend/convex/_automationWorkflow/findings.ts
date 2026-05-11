import { isRecord } from "@conductor/shared/typeGuards";

export interface ParsedFinding {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  filePaths?: string[];
  suggestedFix?: string;
}

type Severity = ParsedFinding["severity"];

const VALID_SEVERITIES: Record<string, Severity> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

/** Extracts structured findings from the FINDINGS_JSON marker in the LLM result text. */
export function parseFindingsFromResult(
  resultText: string,
): ParsedFinding[] | null {
  const markerIdx = resultText.indexOf("<!-- FINDINGS_JSON -->");
  if (markerIdx === -1) return null;

  const afterMarker = resultText.slice(markerIdx);
  const jsonMatch = afterMarker.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return null;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[1].trim());
    if (!Array.isArray(parsed)) return null;

    const findings: ParsedFinding[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item: unknown = parsed[i];
      if (!isRecord(item)) continue;

      const title = item.title;
      const description = item.description;
      const severityRaw = item.severity;

      if (typeof title !== "string" || typeof description !== "string")
        continue;
      if (typeof severityRaw !== "string") continue;

      const severity = VALID_SEVERITIES[severityRaw];
      if (!severity) continue;

      const finding: ParsedFinding = {
        id: `finding-${String(i)}`,
        title,
        description,
        severity,
      };

      if (
        Array.isArray(item.filePaths) &&
        item.filePaths.every((fp: unknown) => typeof fp === "string")
      ) {
        const paths: string[] = [];
        for (const fp of item.filePaths) {
          if (typeof fp === "string") paths.push(fp);
        }
        finding.filePaths = paths;
      }

      if (typeof item.suggestedFix === "string") {
        finding.suggestedFix = item.suggestedFix;
      }

      findings.push(finding);
    }
    return findings.length > 0 ? findings : null;
  } catch {
    return null;
  }
}
