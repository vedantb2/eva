import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  describeVercelSandboxSource,
  resolveVercelSandboxSource,
} from "../convex/_sandbox/vercelImage";

const testsDir = dirname(fileURLToPath(import.meta.url));

/**
 * The Managed Images flip is gated because the two facts that decide whether
 * Ubuntu is safe — the container user/$HOME and whether apt covers eva's
 * toolchain — were never settled by a live run. Until they are, an unset env
 * var has to keep producing exactly today's behaviour.
 */
describe("resolveVercelSandboxSource", () => {
  test("defaults to the AL2023 runtime when unset", () => {
    expect(resolveVercelSandboxSource(undefined)).toEqual({
      runtime: "node24",
    });
    expect(resolveVercelSandboxSource("")).toEqual({ runtime: "node24" });
    expect(resolveVercelSandboxSource("   ")).toEqual({ runtime: "node24" });
  });

  test("keeps the legacy runtime when named explicitly", () => {
    expect(resolveVercelSandboxSource("node24")).toEqual({ runtime: "node24" });
  });

  test("expands a managed image short name", () => {
    expect(resolveVercelSandboxSource("universal")).toEqual({
      image: "vercel/sandbox/universal",
    });
    expect(resolveVercelSandboxSource("ubuntu")).toEqual({
      image: "vercel/sandbox/ubuntu",
    });
    // Colon, not a bare `node24` — the SDK's managed image names are `node:24`.
    expect(resolveVercelSandboxSource("node:24")).toEqual({
      image: "vercel/sandbox/node:24",
    });
  });

  test("passes a pinned tag or digest through verbatim", () => {
    expect(
      resolveVercelSandboxSource("vercel/sandbox/universal:2026.01"),
    ).toEqual({ image: "vercel/sandbox/universal:2026.01" });
    expect(
      resolveVercelSandboxSource("vercel/sandbox/universal@sha256:abc123"),
    ).toEqual({ image: "vercel/sandbox/universal@sha256:abc123" });
  });

  /**
   * A typo must fail loudly at create time. Falling back to the default would
   * boot every sandbox on the wrong distro, and the toolchain failure that
   * follows is far harder to attribute than a create error.
   */
  test("throws on an unrecognised value", () => {
    expect(() => resolveVercelSandboxSource("node24-ubuntu")).toThrow(
      /VERCEL_SANDBOX_IMAGE/,
    );
    expect(() => resolveVercelSandboxSource("alpine")).toThrow(
      /VERCEL_SANDBOX_IMAGE/,
    );
  });

  test("never returns both properties", () => {
    for (const setting of [undefined, "node24", "universal"]) {
      const source = resolveVercelSandboxSource(setting);
      const keys = Object.keys(source);
      expect(keys).toHaveLength(1);
      expect(["runtime", "image"]).toContain(keys[0]);
    }
  });
});

describe("describeVercelSandboxSource", () => {
  test("labels each variant for create logs", () => {
    expect(describeVercelSandboxSource({ runtime: "node24" })).toBe(
      "runtime=node24",
    );
    expect(
      describeVercelSandboxSource({ image: "vercel/sandbox/universal" }),
    ).toBe("image=vercel/sandbox/universal");
  });
});

/**
 * Vercel forbids `runtime`/`image` on a snapshot source, and eva restores from
 * a snapshot on every warm start — so the resolver must only reach the fresh
 * branch of `create`.
 */
test("snapshot restores never pass a base image", () => {
  const source = readFileSync(
    join(testsDir, "../convex/_sandbox/vercelProvider.ts"),
    "utf8",
  );
  const createAt = source.indexOf("async create(params: SandboxCreateParams)");
  expect(createAt, "VercelSandboxClient.create moved").toBeGreaterThan(-1);
  const body = source.slice(
    createAt,
    source.indexOf("\n  async get(", createAt),
  );

  const snapshotBranchAt = body.indexOf('source: { type: "snapshot"');
  const freshBranchAt = body.indexOf("...freshSource");
  expect(snapshotBranchAt).toBeGreaterThan(-1);
  expect(
    freshBranchAt,
    "the fresh branch must spread the resolved source",
  ).toBeGreaterThan(snapshotBranchAt);
  expect(
    body.slice(snapshotBranchAt, freshBranchAt),
    "the snapshot branch must not carry runtime/image",
  ).not.toMatch(/freshSource|runtime:|image:/);
});
