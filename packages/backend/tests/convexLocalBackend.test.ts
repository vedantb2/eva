import { describe, expect, it } from "vitest";
import {
  CONVEX_LOCAL_BACKEND_HEALTH_URL,
  EXPECTED_LATEST_CONVEX_LOCAL_BACKEND_VERSION,
  PINNED_CONVEX_LOCAL_BACKEND_VERSION,
  buildConvexBackgroundScriptBody,
  isConvexBackendCommand,
} from "../convex/_daytona/convexLocalBackend";

describe("buildConvexBackgroundScriptBody", () => {
  it("plants pin under expected latest label and keeps command flag-free", () => {
    const command =
      "cd apps/eprocurement && CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS=240 npx convex dev";
    const body = buildConvexBackgroundScriptBody(command);
    expect(body).toContain("unset CONVEX_AGENT_MODE");
    expect(body).toContain(`PIN = "${PINNED_CONVEX_LOCAL_BACKEND_VERSION}"`);
    expect(body).toContain(
      `EXPECTED_LATEST = "${EXPECTED_LATEST_CONVEX_LOCAL_BACKEND_VERSION}"`,
    );
    expect(body).toContain("curl");
    expect(body).toContain("version.convex.dev/v1/local_backend_version");
    expect(body).toContain(command);
    expect(body).not.toContain("--local-backend-version");
    expect(isConvexBackendCommand(command)).toBe(true);
  });

  it("wraps the command in the self-heal supervisor", () => {
    const command =
      "cd apps/eprocurement && CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS=240 npx convex dev";
    const body = buildConvexBackgroundScriptBody(command);
    // Command travels via heredoc into its own process group, verbatim.
    expect(body).toContain("<<'EVA_CONVEX_BG_CMD'");
    expect(body).toContain(`setsid bash -l "/tmp/eva-convex-bg-cmd-$$.sh"`);
    // Health probe against the local backend, wedge-restart with a cap.
    expect(body).toContain(CONVEX_LOCAL_BACKEND_HEALTH_URL);
    expect(body).toContain("Unable to pull deployment config");
    expect(body).toContain("pkill -KILL -f '[c]onvex-local-backend'");
  });
});
