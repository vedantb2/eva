import { describe, expect, it } from "vitest";
import {
  PINNED_CONVEX_LOCAL_BACKEND_VERSION,
  buildConvexBackgroundScriptBody,
  isConvexBackendCommand,
  withPinnedLocalBackendVersion,
} from "../convex/_daytona/convexLocalBackend";

describe("withPinnedLocalBackendVersion", () => {
  it("injects --local-backend-version into npx convex dev", () => {
    const input =
      "cd apps/eprocurement && CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS=240 npx convex dev";
    expect(withPinnedLocalBackendVersion(input)).toBe(
      `cd apps/eprocurement && CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS=240 npx convex dev --local-backend-version ${PINNED_CONVEX_LOCAL_BACKEND_VERSION}`,
    );
  });

  it("injects into guarded web background command", () => {
    const input =
      'pgrep -f "[c]onvex dev" > /dev/null || (cd /tmp/repo/apps/web && CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS=180 npx convex dev)';
    expect(withPinnedLocalBackendVersion(input)).toContain(
      `npx convex dev --local-backend-version ${PINNED_CONVEX_LOCAL_BACKEND_VERSION}`,
    );
    expect(withPinnedLocalBackendVersion(input)).toContain(
      'pgrep -f "[c]onvex dev"',
    );
  });

  it("does not double-inject when already pinned", () => {
    const input = `npx convex dev --local-backend-version ${PINNED_CONVEX_LOCAL_BACKEND_VERSION}`;
    expect(withPinnedLocalBackendVersion(input)).toBe(input);
  });
});

describe("buildConvexBackgroundScriptBody", () => {
  it("unsets agent mode, pins config, and runs pinned command", () => {
    const body = buildConvexBackgroundScriptBody("npx convex dev");
    expect(body).toContain("unset CONVEX_AGENT_MODE");
    expect(body).toContain(`PIN = "${PINNED_CONVEX_LOCAL_BACKEND_VERSION}"`);
    expect(body).toContain(
      `npx convex dev --local-backend-version ${PINNED_CONVEX_LOCAL_BACKEND_VERSION}`,
    );
    expect(isConvexBackendCommand("npx convex dev")).toBe(true);
    expect(isConvexBackendCommand("pnpm migrate")).toBe(false);
  });
});
