import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const source = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../convex/_automations/systemInstall.ts",
  ),
  "utf8",
);
const install = definitionBody(source, "installSystemAutomation");
const uninstall = definitionBody(source, "uninstallSystemAutomation");

describe("system automation install lifecycle", () => {
  test("authorizes before reading or mutating an install", () => {
    expect(install.indexOf("authorizeInstall(")).toBeLessThan(
      install.indexOf("findInstall("),
    );
    expect(uninstall.indexOf("authorizeInstall(")).toBeLessThan(
      uninstall.indexOf("findInstall("),
    );
  });

  test("reuses a soft-deleted row instead of duplicating its history", () => {
    expect(install).toContain("existing?._id ??");
    expect(install).toContain('ctx.db.insert("automations"');
  });

  test("preserves a customized schedule when reinstalling", () => {
    expect(install).toContain(
      "existing?.cronSchedule || entry.defaultCronSchedule",
    );
  });

  test("revives and enables the row before registering its cron", () => {
    expect(install).toContain("deletedAt: undefined");
    expect(install).toContain("enabled: true");
    expect(install).toContain("cronJobId: await safeReplaceCron(");
  });

  test("uninstall is idempotent for missing or deleted rows", () => {
    expect(uninstall).toContain(
      "if (!install || install.deletedAt !== undefined) return null",
    );
  });

  test("removes the cron before soft-deleting the row", () => {
    const deleteCronAt = uninstall.indexOf("safeDeleteCron(");
    const patchAt = uninstall.indexOf("ctx.db.patch(");
    expect(deleteCronAt).toBeGreaterThan(-1);
    expect(patchAt).toBeGreaterThan(deleteCronAt);
  });

  test("disables without destroying run history or the schedule", () => {
    expect(uninstall).toContain("enabled: false");
    expect(uninstall).toContain("cronJobId: undefined");
    expect(uninstall).toContain("deletedAt: now");
    expect(uninstall).not.toContain("ctx.db.delete(");
  });
});

function definitionBody(input: string, name: string): string {
  const startAt = input.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const endAt = input.indexOf("\n});", startAt);
  return input.slice(startAt, endAt < 0 ? undefined : endAt);
}
