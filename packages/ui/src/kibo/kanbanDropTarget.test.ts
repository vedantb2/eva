import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { cn } from "../utils/cn";
import type { KanbanColumnDef, KanbanItem } from "./kanban";
import { resolveOverColumnId } from "./kanbanDropTarget";

const columns: KanbanColumnDef[] = [
  { id: "todo", name: "Todo" },
  { id: "doing", name: "Doing" },
  { id: "done", name: "Done" },
];

const data: KanbanItem[] = [
  { id: "card-1", name: "First", column: "todo" },
  { id: "card-2", name: "Second", column: "doing" },
];

test("a column under the pointer resolves to itself", () => {
  expect(resolveOverColumnId("doing", columns, data)).toBe("doing");
});

/**
 * The regression: dnd-kit reports the *card* under the pointer, not the column,
 * so a column holding any cards never sees its own `isOver` and never
 * highlighted. Resolving the card back to its column is the whole fix.
 */
test("a card under the pointer resolves to the column holding it", () => {
  expect(resolveOverColumnId("card-1", columns, data)).toBe("todo");
  expect(resolveOverColumnId("card-2", columns, data)).toBe("doing");
});

test("nothing under the pointer clears the drop target", () => {
  expect(resolveOverColumnId(null, columns, data)).toBeNull();
});

test("an unknown id clears the drop target rather than guessing", () => {
  expect(resolveOverColumnId("card-gone", columns, data)).toBeNull();
});

test("an empty column is still a valid drop target", () => {
  expect(resolveOverColumnId("done", columns, data)).toBe("done");
});

/**
 * tailwind-merge keeps whichever conflicting utility comes last, so a drop
 * highlight placed before the caller's `className` is silently dropped in favour
 * of the column's own background — the highlight has to be the last word.
 */
test("a bg-* utility only survives cn() when it comes last", () => {
  const callerBackground = "bg-muted";
  const highlight = "bg-muted";
  const highlightBorder = "border-primary/40";

  expect(cn("border border-border bg-muted", callerBackground, highlight)).toContain(
    highlight,
  );
  // The buggy order, kept as the counter-example for border highlight.
  expect(
    cn("border border-border", highlightBorder, "border-border"),
  ).not.toContain(highlightBorder);
});

test("KanbanBoard applies the drop highlight after the caller's className", () => {
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "kanban.tsx"),
    "utf8",
  );
  const classNameAt = source.indexOf("        className,");
  const highlightAt = source.indexOf(
    'isDropTarget && "border-primary/40 bg-muted"',
  );
  expect(classNameAt, "KanbanBoard's cn() call moved").toBeGreaterThan(-1);
  expect(
    highlightAt,
    "the drop highlight moved or was removed",
  ).toBeGreaterThan(-1);
  expect(
    classNameAt,
    "the highlight must come after className or tailwind-merge drops it",
  ).toBeLessThan(highlightAt);
});
