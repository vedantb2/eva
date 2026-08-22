import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  AUTOMATION_APP_SORT_LABELS,
  AUTOMATION_SORT_LABELS,
  AUTOMATION_SORT_ORDERS,
  DEFAULT_AUTOMATIONS_SIDEBAR_SETTINGS,
  isAutomationSortOrder,
} from "./automationsSidebarSettings";
import { APP_SORT_ORDERS } from "./sessionsSidebarSettings";

const here = dirname(fileURLToPath(import.meta.url));

describe("automations sidebar defaults", () => {
  // Regression: the sidebar sorted both lists by `updated_at` regardless of the
  // saved preference, so every automation run reshuffled the panel under the
  // pointer. Apps follow the rail, automations their creation date.
  test("hold both lists still when a run lands", () => {
    expect(DEFAULT_AUTOMATIONS_SIDEBAR_SETTINGS.appSortOrder).toBe("manual");
    expect(DEFAULT_AUTOMATIONS_SIDEBAR_SETTINGS.automationSortOrder).toBe(
      "created_at",
    );
  });
});

describe("automation sort order guard", () => {
  test.each([...AUTOMATION_SORT_ORDERS])("accepts %s", (value) => {
    expect(isAutomationSortOrder(value)).toBe(true);
  });

  // `manual` is an app-only order: automations have no rail position to follow,
  // and the value is passed straight to `sortSessionsForSidebar`.
  test.each(["manual", "", "recent", "Created_at"])(
    "rejects %s so a stale persisted value falls back",
    (value) => {
      expect(isAutomationSortOrder(value)).toBe(false);
    },
  );
});

describe("sort menu labels", () => {
  test("cover every order the menu can offer", () => {
    for (const order of APP_SORT_ORDERS) {
      expect(AUTOMATION_APP_SORT_LABELS[order]).toBeTruthy();
    }
    for (const order of AUTOMATION_SORT_ORDERS) {
      expect(AUTOMATION_SORT_LABELS[order]).toBeTruthy();
    }
  });
});

/**
 * The bug was not in this module — it was the two callers passing a literal.
 * Sorting is invisible in a unit test of the settings, so pin the wiring.
 */
describe("sidebar wiring", () => {
  test("sorts from the saved settings, never a hardcoded order", () => {
    const sidebar = readFileSync(
      join(here, "../GlobalAutomationsSidebar.tsx"),
      "utf8",
    );
    expect(sidebar).toContain("settings.appSortOrder");
    expect(sidebar).toContain(
      "automationSortOrder={settings.automationSortOrder}",
    );

    const group = readFileSync(
      join(here, "../_components/GlobalAutomationGroup.tsx"),
      "utf8",
    );
    expect(group).toContain(
      "sortSessionsForSidebar(automations, automationSortOrder)",
    );
    for (const order of AUTOMATION_SORT_ORDERS) {
      expect(group).not.toContain(`"${order}"`);
    }
  });
});
