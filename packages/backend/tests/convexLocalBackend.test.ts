import { describe, expect, it } from "vitest";
import {
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
});
