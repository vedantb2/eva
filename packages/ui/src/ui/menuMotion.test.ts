import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { menuContentClass } from "./_menu-classes";

const uiDir = dirname(fileURLToPath(import.meta.url));

/**
 * Menu motion has been removed and restored once already (fix 8db9e4c8). The
 * first version eased in and out over the same 150ms, which made composer menus
 * feel sticky *after* a selection, and the response was to strip the animation
 * altogether rather than to shorten the exit. Both endpoints of that history are
 * worth pinning: the motion exists, and the exit is the quick half.
 */
describe("menu content motion", () => {
  const classes = menuContentClass("origin-test");

  it("animates in both directions", () => {
    expect(classes).toContain("data-[state=open]:animate-in");
    expect(
      classes,
      "with no exit the menu hard-cuts away under the click that dismissed it",
    ).toContain("data-[state=closed]:animate-out");
  });

  it("scales and fades rather than only fading", () => {
    expect(classes).toMatch(/data-\[state=open\]:zoom-in-\d+/);
    expect(classes).toMatch(/data-\[state=closed\]:zoom-out-\d+/);
    expect(classes).toMatch(/data-\[state=open\]:fade-in-\d+/);
    expect(classes).toMatch(/data-\[state=closed\]:fade-out-\d+/);
  });

  /** The asymmetry *is* the fix — a symmetric exit is what got the motion cut. */
  it("leaves faster than it arrives", () => {
    const enterMs = Number(/(?:^| )duration-(\d+)/.exec(classes)?.[1]);
    const exitMs = Number(
      /data-\[state=closed\]:duration-(\d+)/.exec(classes)?.[1],
    );
    expect(enterMs).toBeGreaterThan(0);
    expect(exitMs).toBeGreaterThan(0);
    expect(exitMs, "a symmetric exit reads as sticky on click").toBeLessThan(
      enterMs,
    );
  });

  /**
   * Tailwind only emits a class it can see as a literal, so the origin has to
   * arrive already spelled out. An interpolated one compiles and silently drops
   * the transform-origin, leaving the menu to scale from its own centre.
   */
  it("passes the caller's origin through", () => {
    expect(classes).toContain("origin-test");
  });
});

/**
 * Radix publishes the transform-origin under a var named for the specific
 * primitive, so the dropdown's var is empty inside a context menu and vice
 * versa. Copying the line between these two files is the obvious edit and
 * leaves the menu growing from its middle instead of from the pointer — motion
 * that still plays, so nothing looks broken enough to chase.
 */
describe("each primitive scales from its own trigger", () => {
  const primitives = [
    { file: "dropdown-menu.tsx", slug: "dropdown-menu" },
    { file: "context-menu.tsx", slug: "context-menu" },
  ];

  it.each(primitives)("$file uses the $slug origin var", ({ file, slug }) => {
    const source = stripComments(readFileSync(join(uiDir, file), "utf8"));
    const call = /menuContentClass\(\s*"([^"]+)"/.exec(source)?.[1];
    expect(call, "the content class is no longer built from the helper").toBe(
      `origin-(--radix-${slug}-content-transform-origin)`,
    );
  });

  /** Neither file may hand-roll the shared class list around the helper. */
  it.each(primitives)("$file takes its motion from the helper", ({ file }) => {
    const source = stripComments(readFileSync(join(uiDir, file), "utf8"));
    expect(source).toContain("menuContentClass(");
    expect(source, "a local copy drifts from the shared timing").not.toContain(
      "animate-in",
    );
  });
});

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
