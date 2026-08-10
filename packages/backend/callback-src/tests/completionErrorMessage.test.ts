import { describe, expect, test } from "vitest";
import { buildErrorMessage } from "../runtime/completion.js";

describe("one-shot completion errors", () => {
  test("fatal heartbeat errors win over every local diagnosis", () => {
    expect(
      buildErrorMessage(
        137,
        "lease lost",
        "tool stalled",
        true,
        true,
        true,
        true,
        true,
        true,
      ),
    ).toBe("lease lost");
  });

  test("tool stalls win over timeout flags", () => {
    expect(
      buildErrorMessage(
        1,
        "",
        "tool stalled",
        true,
        true,
        true,
        true,
        true,
        true,
      ),
    ).toBe("tool stalled");
  });

  test("names each timeout phase", () => {
    expect(
      buildErrorMessage(1, "", "", true, false, false, false, false, false),
    ).toContain("max runtime");
    expect(
      buildErrorMessage(1, "", "", false, true, false, false, false, false),
    ).toContain("no stdout");
    expect(
      buildErrorMessage(1, "", "", false, false, true, false, false, false),
    ).toContain("no parseable");
    expect(
      buildErrorMessage(1, "", "", false, false, false, true, false, false),
    ).toContain("no assistant response");
    expect(
      buildErrorMessage(1, "", "", false, false, false, false, true, false),
    ).toContain("stalled after first text");
    expect(
      buildErrorMessage(1, "", "", false, false, false, false, false, true),
    ).toContain("zombie state");
  });

  test("reports SIGKILL-style exits as memory interruptions", () => {
    const message = buildErrorMessage(
      137,
      "",
      "",
      false,
      false,
      false,
      false,
      false,
      false,
    );
    expect(message).toContain("ran out of memory");
    expect(message).toContain("nothing was completed");
  });

  test("reports SIGTERM-style exits as cancellations, never success", () => {
    const message = buildErrorMessage(
      143,
      "",
      "",
      false,
      false,
      false,
      false,
      false,
      false,
    );
    expect(message).toContain("run was interrupted");
    expect(message).toContain("nothing was completed");
  });

  test("keeps ordinary non-zero exits diagnosable", () => {
    expect(
      buildErrorMessage(23, "", "", false, false, false, false, false, false),
    ).toBe("Claude CLI exited with code 23");
  });
});
