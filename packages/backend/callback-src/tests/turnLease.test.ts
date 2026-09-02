import { beforeEach, describe, expect, test } from "vitest";
import {
  beginTurnOwnership,
  decideTurnLeaseExit,
  endTurnOwnership,
  getLeaseTerminalReason,
  noteHeartbeatResponse,
} from "../runtime/turnLease.js";
import type { JsonValue } from "../types.js";

beforeEach(() => {
  // Ownership transitions clear the terminal fence, so this resets the module.
  endTurnOwnership();
});

/**
 * `noteHeartbeatResponse` is the only thing that stops a superseded daemon from
 * writing over its successor: the server answers a fenced heartbeat with a
 * terminal lease, and the daemon has to recognise it in every response shape it
 * can arrive in (HMAC endpoint JSON string, mutation envelope, bare object).
 */
describe("noteHeartbeatResponse", () => {
  beforeEach(() => {
    beginTurnOwnership("claim", { turnId: "turn-1", leaseGeneration: 3 });
  });

  test("records a terminal reason from a bare payload", () => {
    expect(
      noteHeartbeatResponse({
        accepted: false,
        lease: { status: "terminal", reason: "superseded" },
      }),
    ).toBe(true);
    expect(getLeaseTerminalReason()).toBe("superseded");
  });

  test("unwraps the nested mutation `value` envelope", () => {
    expect(
      noteHeartbeatResponse({
        status: "success",
        value: {
          accepted: false,
          lease: { status: "terminal", reason: "cancelled" },
        },
      }),
    ).toBe(true);
    expect(getLeaseTerminalReason()).toBe("cancelled");
  });

  test("parses a JSON string response", () => {
    expect(
      noteHeartbeatResponse(
        JSON.stringify({ lease: { status: "terminal", reason: "timeout" } }),
      ),
    ).toBe(true);
    expect(getLeaseTerminalReason()).toBe("timeout");
  });

  test("falls back to closed for an unknown reason", () => {
    expect(
      noteHeartbeatResponse({
        lease: { status: "terminal", reason: "something-new" },
      }),
    ).toBe(true);
    expect(getLeaseTerminalReason()).toBe("closed");
  });

  test("falls back to closed for a missing reason", () => {
    expect(noteHeartbeatResponse({ lease: { status: "terminal" } })).toBe(true);
    expect(getLeaseTerminalReason()).toBe("closed");
  });

  const benign: [string, JsonValue][] = [
    ["a healthy renewal", { lease: { status: "renewed", expiresAt: 1 } }],
    ["an accepted legacy heartbeat", { accepted: true }],
    ["a non-object lease", { lease: "terminal" }],
    ["an array payload", ["terminal"]],
    ["unparseable text", "<html>502</html>"],
  ];

  test.each(benign)("leaves the fence clear for %s", (_label, response) => {
    expect(noteHeartbeatResponse(response)).toBe(false);
    expect(getLeaseTerminalReason()).toBeNull();
  });

  test("keeps the first terminal reason once one has landed", () => {
    noteHeartbeatResponse({
      lease: { status: "terminal", reason: "superseded" },
    });
    expect(
      noteHeartbeatResponse({
        lease: { status: "terminal", reason: "timeout" },
      }),
    ).toBe(true);
    expect(getLeaseTerminalReason()).toBe("superseded");
  });

  test("a new turn's ownership clears the previous fence", () => {
    noteHeartbeatResponse({
      lease: { status: "terminal", reason: "superseded" },
    });
    beginTurnOwnership("claim", { turnId: "turn-2", leaseGeneration: 1 });
    expect(getLeaseTerminalReason()).toBeNull();
  });
});

/**
 * A terminal lease exits the process; the latch keeps a 10s heartbeat tick and
 * a 150ms flush tick from scheduling two exits for the same fence.
 */
describe("decideTurnLeaseExit", () => {
  test("keeps running while no terminal lease has landed", () => {
    expect(
      decideTurnLeaseExit({ terminalReason: null, exitScheduled: false }),
    ).toEqual({ action: "continue" });
  });

  test("schedules the exit on the first terminal tick", () => {
    expect(
      decideTurnLeaseExit({
        terminalReason: "superseded",
        exitScheduled: false,
      }),
    ).toEqual({ action: "exit", reason: "superseded" });
  });

  test("does not reschedule an exit that is already pending", () => {
    expect(
      decideTurnLeaseExit({ terminalReason: "closed", exitScheduled: true }),
    ).toEqual({ action: "wait" });
  });

  test("still reports terminal once the exit is scheduled", () => {
    // setFinalizingState returns this so callers skip posting a completion.
    const decision = decideTurnLeaseExit({
      terminalReason: "cancelled",
      exitScheduled: true,
    });
    expect(decision.action).not.toBe("continue");
  });
});
