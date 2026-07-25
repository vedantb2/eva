import { expect, test } from "vitest";
import {
  extractFailuresFromJson,
  parseSectionsFromJson,
} from "../convex/_taskWorkflow/auditParser";
import {
  AUDIT_SECTION_REGEX,
  escapeTableCell,
  mergeBodyWithAuditSection,
} from "../convex/_taskWorkflow/prAudit";

test("escapeTableCell escapes pipes and flattens newlines", () => {
  expect(escapeTableCell("a|b\nc")).toBe("a\\|b c");
});

test("parseSectionsFromJson drops invalid rows and keeps failures extractable", () => {
  const sections = parseSectionsFromJson({
    sections: [
      {
        name: "Testing",
        results: [
          {
            requirement: "Typecheck",
            passed: true,
            detail: "ok",
            severity: "low",
          },
          {
            requirement: "Broken",
            passed: false,
            detail: "fail detail",
            severity: "high",
          },
          null,
        ],
      },
      null,
    ],
  });

  expect(sections).toEqual([
    {
      name: "Testing",
      results: [
        {
          requirement: "Typecheck",
          passed: true,
          detail: "ok",
          severity: "low",
        },
        {
          requirement: "Broken",
          passed: false,
          detail: "fail detail",
          severity: "high",
        },
      ],
    },
  ]);

  expect(
    extractFailuresFromJson({
      sections: [
        {
          name: "Testing",
          results: [
            {
              requirement: "Broken",
              passed: false,
              detail: "fail detail",
              severity: "high",
            },
          ],
        },
      ],
    }),
  ).toEqual([
    {
      section: "Testing",
      requirement: "Broken",
      detail: "fail detail",
    },
  ]);
});

test("mergeBodyWithAuditSection replaces prior EVA audit markers", () => {
  const previous = [
    "## Task",
    "Hello",
    "",
    "<!-- EVA_AUDIT_START -->",
    "old audit",
    "<!-- EVA_AUDIT_END -->",
    "",
    "*Created by Eva*",
  ].join("\n");

  const next = mergeBodyWithAuditSection(
    previous,
    "<!-- EVA_AUDIT_START -->\n## Post-Execution Audit\nnew\n<!-- EVA_AUDIT_END -->",
  );

  expect(next).toContain("## Post-Execution Audit\nnew");
  expect(next).not.toContain("old audit");
  expect(AUDIT_SECTION_REGEX.test(previous)).toBe(true);
});
