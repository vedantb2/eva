import { describe, expect, test } from "vitest";
import { tabGroupColorForId } from "./tabGroupColors";

/**
 * The tab-group accent has to be stable per repo id (a group that changes
 * colour on every render is the bug this file exists to prevent) and every
 * palette entry must be internally consistent: the selected-tab stroke, pill
 * and underline all paint the same hue (fix db5fb5eb added `border`/`accent`
 * for exactly this — a new colour that forgets one, or mixes hues, silently
 * breaks the selected-tab stroke). These lock both contracts without pinning
 * any id to a specific colour, so the palette can still grow freely.
 */
describe("tabGroupColorForId", () => {
  const ids = Array.from({ length: 64 }, (_, i) => `repo-id-${i}`);

  test("is deterministic — the same id always yields the same accent", () => {
    for (const id of ids) {
      expect(tabGroupColorForId(id)).toEqual(tabGroupColorForId(id));
    }
  });

  test("never crashes and always returns a fully populated accent", () => {
    for (const id of [...ids, "", "z"]) {
      const color = tabGroupColorForId(id);
      expect(color.underline).toBeTruthy();
      expect(color.pill).toBeTruthy();
      expect(color.border).toBeTruthy();
      expect(color.accent).toBeTruthy();
    }
  });

  test("underline, border, accent and pill all share one hue", () => {
    for (const id of [...ids, ""]) {
      const color = tabGroupColorForId(id);
      const hue = /^bg-([a-z]+)-500$/.exec(color.underline)?.[1];
      expect(hue).toBeTruthy();
      expect(color.border).toBe(`border-${hue}-500`);
      expect(color.accent).toBe(`text-${hue}-500`);
      expect(color.pill.startsWith(`bg-${hue}-500`)).toBe(true);
    }
  });

  test("spreads ids across more than one palette entry", () => {
    const hues = new Set(ids.map((id) => tabGroupColorForId(id).underline));
    expect(hues.size).toBeGreaterThan(1);
  });
});
