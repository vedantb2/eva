import { describe, expect, it } from "vitest";
import {
  PINNED_CONVEX_LOCAL_BACKEND_VERSION,
  buildConvexBackgroundScriptBody,
  isConvexBackendCommand,
} from "../convex/_daytona/convexLocalBackend";

describe("buildConvexBackgroundScriptBody", () => {
  it("unsets agent mode, plants pin under latest cache label, keeps command flag-free", () => {
    const command =
      "cd apps/eprocurement && CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS=240 npx convex dev";
    const body = buildConvexBackgroundScriptBody(command);
    expect(body).toContain("unset CONVEX_AGENT_MODE");
    expect(body).toContain(`PIN = "${PINNED_CONVEX_LOCAL_BACKEND_VERSION}"`);
    expect(body).toContain("version.convex.dev/v1/local_backend_version");
    expect(body).toContain(
      "github.com/get-convex/convex-backend/releases/download/",
    );
    expect(body).toContain(".eva-glibc-pin");
    expect(body).toContain(command);
    expect(body).not.toContain("--local-backend-version");
    expect(isConvexBackendCommand(command)).toBe(true);
    expect(isConvexBackendCommand("pnpm migrate")).toBe(false);
  });

  it("preserves guarded web background command text", () => {
    const command =
      'pgrep -f "[c]onvex dev" > /dev/null || (cd /tmp/repo/apps/web && CONVEX_LOCAL_BACKEND_STARTUP_TIMEOUT_SECS=180 npx convex dev)';
    const body = buildConvexBackgroundScriptBody(command);
    expect(body.endsWith(command)).toBe(true);
    expect(body).not.toContain("--local-backend-version");
  });
});
