type AuditSeverity = "critical" | "high" | "medium" | "low";
type EvalResult = {
  requirement: string;
  passed: boolean;
  detail: string;
  severity?: AuditSeverity;
};
type AuditSection = { name: string; results: EvalResult[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEvalResult(item: unknown): item is EvalResult {
  if (!isRecord(item)) return false;
  return (
    typeof item.requirement === "string" &&
    typeof item.passed === "boolean" &&
    typeof item.detail === "string"
  );
}

function parseSeverity(value: unknown): AuditSeverity {
  if (value === "critical") return "critical";
  if (value === "high") return "high";
  if (value === "medium") return "medium";
  if (value === "low") return "low";
  return "medium";
}

function parseResultsArray(value: unknown): EvalResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isEvalResult).map((item) => {
    if (!isRecord(item)) return item;
    return {
      requirement: String(item.requirement),
      passed: Boolean(item.passed),
      detail: String(item.detail),
      severity: parseSeverity(item.severity),
    };
  });
}

export function parseSectionsFromJson(raw: unknown): AuditSection[] {
  if (!isRecord(raw)) return [];

  if (Array.isArray(raw.sections)) {
    return raw.sections
      .filter(isRecord)
      .filter((s) => typeof s.name === "string" && Array.isArray(s.results))
      .map((s) => ({
        name: String(s.name),
        results: parseResultsArray(s.results),
      }));
  }

  return [];
}

export function extractSummaryFromJson(raw: unknown): string {
  if (!isRecord(raw)) return "Audit completed";
  return typeof raw.summary === "string" ? raw.summary : "Audit completed";
}

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
