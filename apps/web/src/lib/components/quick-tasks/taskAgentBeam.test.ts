import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(here, "..");

const cardSource = readFileSource(join(here, "QuickTaskCard.tsx"));

function readFileSource(path: string): string {
  return readFileSync(path, "utf8").replaceAll("\r\n", "\n");
}

/** Every .tsx under lib/components — the card is rendered from several surfaces. */
function componentFiles(): string[] {
  return readdirSync(componentsDir, { recursive: true })
    .map((entry) => String(entry).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".tsx"));
}

/**
 * A chat turn used to promote the task's kanban status so the card would show
 * life while eva worked, which moved cards between columns behind the user's
 * back. That was reverted for a presentation-only signal: the card beams from
 * the live workflow ids, and `status` keeps owning the column and badge (fix
 * 948c867c, replacing 52081d8e).
 */
describe("a working agent beams the card without moving it", () => {
  it("agent activity is read from either live workflow", () => {
    const startAt = cardSource.indexOf("export function isTaskAgentActive");
    expect(startAt, "isTaskAgentActive moved or was renamed").toBeGreaterThan(-1);
    // Ends at the next top-level declaration: the parameter's inline object type
    // closes on a column-0 brace of its own, so that is not the end of the body.
    const boundaries = ["\nexport ", "\ninterface ", "\ntype ", "\nfunction "]
      .map((keyword) => cardSource.indexOf(keyword, startAt + 1))
      .filter((at) => at > -1);
    expect(boundaries.length, "no declaration follows the helper").toBeGreaterThan(
      0,
    );
    const body = cardSource.slice(startAt, Math.min(...boundaries));
    // A chat turn and a main run are separate ids; either one means live.
    expect(body).toContain("task.activeChatWorkflowId !== undefined");
    expect(body).toContain("task.activeWorkflowId !== undefined");
    expect(body, "one missing id is one surface that stops beaming").toContain(
      "||",
    );
  });

  it("the beam turns on for a live agent as well as an in-progress status", () => {
    const derivation = cardSource.match(/const isInProgress =\s*([^;]+);/);
    expect(derivation, "the beam derivation moved").not.toBeNull();
    const expression = derivation?.[1] ?? "";
    expect(expression).toContain('status === "in_progress"');
    expect(expression, "a live agent must beam whatever the column says").toContain(
      "isAgentActive",
    );
    expect(expression, "an errored card shows its error, not a beam").toContain(
      "!hasError",
    );
  });

  it("the beam is the only thing agent activity drives", () => {
    const beamAt = cardSource.indexOf("<BorderBeam");
    expect(beamAt, "the beam moved").toBeGreaterThan(-1);
    expect(cardSource).toContain("const wrappedCard = isInProgress ? (");
    // Column and badge presentation stay keyed off the persisted status.
    expect(cardSource).toContain("const statusMeta = statusConfig[status];");
    expect(
      cardSource.match(/statusConfig\[[^\]]*isAgentActive[^\]]*\]/),
      "status presentation must not be derived from agent activity",
    ).toBeNull();
  });

  /**
   * The part that actually rots: the flag is threaded in per render site, so a
   * new surface — or one that drops the prop in a refactor — silently goes back
   * to showing a task as idle while eva works on it.
   */
  it("every surface that renders the card passes the flag", () => {
    const wired: string[] = [];
    const bare: string[] = [];
    for (const path of componentFiles()) {
      const source = readFileSource(join(componentsDir, path));
      let at = source.indexOf("<QuickTaskCard");
      while (at > -1) {
        const props = source.slice(at, source.indexOf("/>", at));
        if (props.includes("isAgentActive={isTaskAgentActive(")) wired.push(path);
        else bare.push(`${path}:${at}`);
        at = source.indexOf("<QuickTaskCard", at + 1);
      }
    }
    // A scan that found nothing would satisfy the assertion below for free.
    expect(
      wired.length + bare.length,
      "the card moved or was renamed",
    ).toBeGreaterThan(3);
    expect(bare, "pass isAgentActive so the card beams while eva works").toEqual(
      [],
    );
  });
});
