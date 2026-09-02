import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { afterEach, describe, expect, test, vi } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const source = (relPath: string): string =>
  readFileSync(join(here, relPath), "utf8");

/**
 * `EVA_NO_WRITES` is the one cross-provider read-only signal. `ALLOWED_TOOLS`
 * cannot serve: it is Claude's tool vocabulary and only `claudeSdk.ts` reads it,
 * so on Cursor/Codex the master kept its native write tools and only the prompt
 * stood in the way. Each adapter translates the flag into its own option.
 */
describe("the no-writes flag reaches the sandbox", () => {
  const launch = source("../convex/_sandbox_runtime/launch.ts");

  test("launch emits EVA_NO_WRITES only when the turn is read-only", () => {
    expect(launch).toContain("EVA_NO_WRITES=1");
    expect(launch).toContain("if (opts.noWrites)");
  });

  test("the flag is its own env var, not derived from ALLOWED_TOOLS", () => {
    // Deriving it would put a Claude tool-name parser in three other adapters.
    const emitAt = launch.indexOf("EVA_NO_WRITES=1");
    const window = launch.slice(Math.max(0, emitAt - 400), emitAt);
    expect(window).not.toContain("opts.allowedTools");
  });

  test("a read-only daemon can never be mistaken for a warm writable one", () => {
    const execution = source("../convex/_sandbox_runtime/execution.ts");
    // noWrites is part of the opts signature, so a warm daemon launched with
    // write tools is killed and respawned rather than reused for the master.
    expect(execution).toContain('noWrites === true ? "|nowrites" : ""');
    expect(execution).toContain("${streamingEntityId}${readOnly}");
  });
});

describe("Cursor translates the flag into disallowedTools", () => {
  const cursor = source("../callback-src/providers/cursorSdk.ts");

  test("it denies the write tools and nothing else", () => {
    const list = cursor.slice(
      cursor.indexOf("const CURSOR_WRITE_TOOLS"),
      cursor.indexOf("type SdkTokenUsage"),
    );
    expect(list).toContain('"edit"');
    expect(list).toContain('"delete"');
    expect(list).toContain('"applyAgentDiff"');
    // Both are capability groups the master depends on: the shell reads prod
    // logs, and dropping "mcp" would disable the orchestration tools entirely.
    expect(list).not.toContain('"shell"');
    expect(list).not.toContain('"mcp"');
  });

  test("it is a denylist, so an SDK bump cannot strip read-only tools", () => {
    expect(cursor).toContain("disallowedTools");
    expect(cursor).not.toMatch(/\btools:\s*\[/);
  });

  test("it applies only under the flag", () => {
    expect(cursor).toContain(
      "...(NO_WRITES ? { disallowedTools: [...CURSOR_WRITE_TOOLS] } : {})",
    );
  });

  test("it reaches both Agent.create and Agent.resume", () => {
    // The SDK does not persist the option on the agent, so resume must pass it
    // again. Both calls take the same `options` object — that is the mechanism,
    // so pin that they do rather than that two literals exist.
    expect(cursor).toContain("const options: SdkAgentOptions = {");
    expect(cursor).toContain("sdk.Agent.create(options)");
    expect(cursor).toContain("sdk.Agent.resume(savedSessionId, options)");
  });
});

describe("Codex translates the flag into its sandbox mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  /** `NO_WRITES` is read at import time, so the env must be set before it. */
  async function threadOptions(noWrites: boolean) {
    vi.resetModules();
    vi.stubEnv("EVA_NO_WRITES", noWrites ? "1" : "");
    const { buildCodexSdkThreadOptions } =
      await import("../callback-src/providers/codexSdk.js");
    return buildCodexSdkThreadOptions();
  }

  test("a read-only turn cannot write the workspace", async () => {
    const options = await threadOptions(true);
    expect(options.sandboxMode).toBe("read-only");
  });

  test("it does not claim network access it cannot grant", async () => {
    // `networkAccessEnabled` compiles to
    // `--config sandbox_workspace_write.network_access=…`, which only applies to
    // the workspace-write sandbox and is a no-op under read-only. Passing it
    // would look like a guarantee that the master's log-reading shell still
    // reaches the network, which this option does not provide.
    const options = await threadOptions(true);
    expect(options.networkAccessEnabled).toBeUndefined();
  });

  test("writing sessions are unchanged", async () => {
    const options = await threadOptions(false);
    expect(options.sandboxMode).toBe("danger-full-access");
    expect(options.networkAccessEnabled).toBeUndefined();
  });

  test("a blocked write fails instead of stalling on an approval", async () => {
    const options = await threadOptions(true);
    expect(options.approvalPolicy).toBe("never");
  });
});
