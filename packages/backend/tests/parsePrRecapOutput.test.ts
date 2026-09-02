import { describe, expect, test } from "vitest";
import {
  parsePrRecapOutput,
  PR_RECAP_HTML_MARKER,
} from "../convex/_prRecapWorkflow/prompts";

const VALID_MARKDOWN = `## Summary

Adds recap output validation so incomplete model replies are stored as errors.

## Risks
False-ready recaps hid the retry path.
`;

const VALID_HTML = `<!doctype html>
<html>
<head>
<style>
body { font-family: sans-serif; color: #111; }
.add { background: #e6ffed; }
.del { background: #ffeef0; }
</style>
</head>
<body>
<div id="step">Overview</div>
<button type="button">Previous</button>
<button type="button">Next</button>
<script>
const step = 0;
</script>
</body>
</html>`;

function recapOutput(markdown: string, html: string): string {
  return `${markdown}\n${PR_RECAP_HTML_MARKER}\n${html}`;
}

describe("parsePrRecapOutput", () => {
  test("accepts markdown plus a complete HTML walkthrough", () => {
    const parsed = parsePrRecapOutput(recapOutput(VALID_MARKDOWN, VALID_HTML));

    expect(parsed).toEqual({
      ok: true,
      markdown: VALID_MARKDOWN.trim(),
      html: VALID_HTML,
    });
  });

  test("strips an html fence around the walkthrough", () => {
    const parsed = parsePrRecapOutput(
      recapOutput(VALID_MARKDOWN, `\`\`\`html\n${VALID_HTML}\n\`\`\``),
    );

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.html).toBe(VALID_HTML);
    }
  });

  test("rejects progress narration with no marker", () => {
    expect(
      parsePrRecapOutput(
        "I'll turn the 44-file diff into a reviewer recap covering schema and UI.",
      ),
    ).toEqual({ ok: false, reason: "missing_marker" });
  });

  test("rejects a marker with heading-less markdown", () => {
    expect(
      parsePrRecapOutput(
        recapOutput(
          "I'll write the recap next after reading the remaining files.",
          VALID_HTML,
        ),
      ),
    ).toEqual({ ok: false, reason: "invalid_markdown" });
  });

  test("rejects a stub HTML document", () => {
    expect(
      parsePrRecapOutput(
        recapOutput(VALID_MARKDOWN, "<!doctype html><html></html>"),
      ),
    ).toEqual({ ok: false, reason: "invalid_html" });
  });

  test("rejects HTML that never closes the document", () => {
    expect(
      parsePrRecapOutput(
        recapOutput(
          VALID_MARKDOWN,
          `<!doctype html><html><style>body{}</style><script>void 0</script><p>${"x".repeat(200)}`,
        ),
      ),
    ).toEqual({ ok: false, reason: "invalid_html" });
  });
});
