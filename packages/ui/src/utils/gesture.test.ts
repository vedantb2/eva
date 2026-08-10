import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { projectVelocity, rubberband } from "./gesture";

const utilsDir = dirname(fileURLToPath(import.meta.url));
const uiSrc = join(utilsDir, "..");
const webSrc = join(uiSrc, "..", "..", "..", "apps", "web", "src");

/**
 * Both functions were copied verbatim into four surfaces before fix 1d290d9b
 * pulled them here, so every one of them was a place the physics could drift.
 * They are pure maths with no DOM, and each has one property that a plausible
 * rewrite gets wrong — those properties are what these tests hold, rather than
 * the arithmetic, which would only pin the numbers to themselves.
 */
describe("rubberband resistance", () => {
  it("adds nothing at the bound", () => {
    expect(rubberband(0, 100)).toBe(0);
  });

  it("always damps, so the surface trails the finger", () => {
    for (const overshoot of [1, 10, 50, 200, 1000]) {
      expect(rubberband(overshoot, 100)).toBeLessThan(overshoot);
      expect(rubberband(overshoot, 100)).toBeGreaterThan(0);
    }
  });

  /**
   * The point of the curve, and what a plain `overshoot * constant` gets wrong:
   * resistance has to *grow* with the pull. A fixed ratio damps a small drag
   * that should feel 1:1 and still lets a hard drag run a long way, so the
   * bound reads as soft rather than as a bound.
   */
  it("resists harder the further it is pulled", () => {
    const ratios = [1, 10, 100, 1000].map(
      (overshoot) => rubberband(overshoot, 100) / overshoot,
    );
    for (let at = 1; at < ratios.length; at++) {
      const previous = ratios[at - 1] ?? 0;
      expect(ratios[at] ?? 0).toBeLessThan(previous);
    }
  });

  /**
   * The guarantee callers lean on. `ConsoleDock` and `SidebarContext` both add
   * the result back to a bound and write it straight to a style, with no clamp
   * of their own — an unbounded return would let a determined drag push a panel
   * to any size at all.
   */
  it("never travels further than the dimension it is measured against", () => {
    for (const overshoot of [500, 5_000, 500_000]) {
      expect(rubberband(overshoot, 100)).toBeLessThan(100);
    }
  });

  /** So a caller that passes a signed delta gets a signed result, not a jump. */
  it("is symmetric about the bound", () => {
    expect(rubberband(-40, 100)).toBeCloseTo(-rubberband(40, 100), 10);
  });

  it("loosens as the constant grows", () => {
    expect(rubberband(50, 100, 0.9)).toBeGreaterThan(rubberband(50, 100, 0.55));
  });
});

describe("flick projection", () => {
  it("projects nowhere from rest", () => {
    expect(projectVelocity(0)).toBe(0);
  });

  /**
   * The discriminator against the textbook `v² / (2·decel)` form, which the
   * source comment calls out as the wrong curve — it is easy to "correct" this
   * to, and it agrees at one velocity while diverging everywhere else. Apple's
   * exponential-decay form is linear in the release velocity, so twice the
   * flick goes exactly twice as far.
   */
  it("scales linearly with release velocity", () => {
    expect(projectVelocity(2_000)).toBeCloseTo(2 * projectVelocity(1_000), 10);
    expect(projectVelocity(3_000)).toBeCloseTo(3 * projectVelocity(1_000), 10);
  });

  /** A flick left has to project left, or the gallery snaps back the wrong way. */
  it("keeps the direction of the flick", () => {
    expect(projectVelocity(-1_200)).toBeCloseTo(-projectVelocity(1_200), 10);
  });

  it("projects a shorter distance as the deceleration rate drops", () => {
    expect(projectVelocity(1_000, 0.99)).toBeLessThan(
      projectVelocity(1_000, 0.998),
    );
  });
});

/**
 * The extraction is the fix. Four copies meant a tuning change had to be made
 * four times and in practice was made once, so the guard is that no surface
 * carries its own version of either curve again.
 */
describe("the physics live in one place", () => {
  const sources = [uiSrc, webSrc]
    .flatMap((root) =>
      readdirSync(root, { recursive: true })
        .map((entry) => join(root, String(entry)))
        .filter((path) => /\.tsx?$/.test(path) && !path.endsWith(".d.ts")),
    )
    .filter((path) => !path.startsWith(join(utilsDir, "gesture")))
    .map((path) => [path, stripComments(readFileSync(path, "utf8"))] as const);

  it("is not re-declared anywhere", () => {
    const offenders = sources
      .filter(([, source]) =>
        /function (?:rubberband|projectVelocity)\s*\(/.test(source),
      )
      .map(([path]) => path);
    expect(offenders, 'import these from "@eva/ui" instead').toEqual([]);
  });

  /**
   * The deceleration rate is the one magic number in either curve. A surface
   * spelling it out is re-deriving the projection even if it calls the helper.
   */
  it("holds the only deceleration rate", () => {
    const offenders = sources
      .filter(([, source]) => /0\.998|decelerationRate/.test(source))
      .map(([path]) => path);
    expect(offenders, "pass the rate through projectVelocity").toEqual([]);
  });
});

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
