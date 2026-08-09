import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { DRAG_ACTIVATION_DISTANCE_PX } from "./gesture";

const utilsDir = dirname(fileURLToPath(import.meta.url));
const kiboDir = join(utilsDir, "..", "kibo");

const hook = stripComments(
  readFileSync(join(utilsDir, "useDragSensors.ts"), "utf8"),
);

/**
 * dnd-kit's activation constraints are input-specific, and getting one wrong
 * does not degrade the drag — it removes it. This surface has now been fixed
 * three times, once per drag surface:
 *
 *  - kanban: a delay-armed mouse drag cancelled outright whenever the pointer
 *    travelled past `tolerance` before the timer fired, so a fast, decisive
 *    drag never picked the card up (fix 1d290d9b);
 *  - gantt: a `MouseSensor` alone meant bars could not be moved or resized by
 *    touch or pen at all (fix c6d74b1d);
 *  - the quick-tasks list: one `PointerSensor` armed on distance, competing
 *    with the vertical scroll the finger is also describing, so the browser
 *    claimed the gesture and the list could not be reordered by touch (fix
 *    59d82659).
 *
 * All three now share one hook, so the split is worth pinning on its own.
 */
describe("the house drag activation split", () => {
  test("arms the mouse on distance, never on a hold", () => {
    const mouse = sensorCall("MouseSensor");
    expect(mouse, "a hold cancels a fast, decisive mouse drag").not.toContain(
      "delay",
    );
    expect(mouse).toContain("distance: DRAG_ACTIVATION_DISTANCE_PX");
  });

  test("arms touch on a hold, never on distance", () => {
    const touch = sensorCall("TouchSensor");
    expect(
      touch,
      "distance activation loses the gesture to the browser's scroll",
    ).not.toContain("distance");
    expect(touch).toMatch(/delay:\s*\w/);
    // Without a tolerance the hold cancels on the smallest finger tremor.
    expect(touch).toMatch(/tolerance:\s*\w/);
  });

  /** A drag no keyboard can reach is a drag some users simply do not have. */
  test("includes the keyboard sensor", () => {
    expect(hook).toContain("useSensor(KeyboardSensor)");
  });

  /**
   * One `PointerSensor` cannot serve both input types — it takes a single
   * activation constraint, and either choice breaks the other input. Reaching
   * for it here is how all three regressions started.
   */
  test("does not fall back to a single pointer sensor", () => {
    expect(hook).not.toContain("PointerSensor");
  });

  /** The threshold is shared so the gantt cannot drift back to its own literal. */
  test("shares one activation distance", () => {
    expect(DRAG_ACTIVATION_DISTANCE_PX).toBeGreaterThan(0);
    expect(hook).toContain(
      'import { DRAG_ACTIVATION_DISTANCE_PX } from "./gesture"',
    );
  });
});

/**
 * Scoped to the shared kibo primitives, which is where the three fixes landed.
 * Several app-level `DndContext`s still build their own sensors and are NOT
 * covered here.
 */
describe("every shared drag surface uses the split", () => {
  const surfaces = readdirSync(kiboDir)
    .filter((name) => name.endsWith(".tsx"))
    .map(
      (name) =>
        [
          name,
          stripComments(readFileSync(join(kiboDir, name), "utf8")),
        ] as const,
    )
    .filter(([, source]) => source.includes("<DndContext"));

  test("the surfaces this pins still exist", () => {
    // list, kanban and gantt-features — a drop here means one was removed or
    // renamed, not that the contract got easier.
    expect(surfaces.map(([name]) => name).sort()).toEqual([
      "gantt-features.tsx",
      "kanban.tsx",
      "list.tsx",
    ]);
  });

  test.each(surfaces)("%s takes its sensors from the hook", (_name, source) => {
    expect(source).toContain("useDragSensors()");
    expect(
      source,
      "a local sensor set drifts from the shared split",
    ).not.toContain("useSensor(");
  });
});

/** The `useSensor(X, …)` call for one sensor, up to its closing paren. */
function sensorCall(sensor: string): string {
  const startAt = hook.indexOf(`useSensor(${sensor}`);
  expect(startAt, `${sensor} is no longer armed`).toBeGreaterThan(-1);
  const nextAt = hook.indexOf("useSensor(", startAt + 1);
  return hook.slice(startAt, nextAt < 0 ? undefined : nextAt);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
