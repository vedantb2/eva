import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));

const backendPackage = readFileSync(join(testsDir, "../package.json"), "utf8");
const claudeLoader = readFileSync(
  join(testsDir, "../callback-src/providers/claudeSdk.ts"),
  "utf8",
);
const cursorLoader = readFileSync(
  join(testsDir, "../callback-src/providers/cursorSdk.ts"),
  "utf8",
);
const opencodeLoader = readFileSync(
  join(testsDir, "../callback-src/providers/opencodeSdk.ts"),
  "utf8",
);
const snapshotActions = readFileSync(
  join(testsDir, "../convex/snapshotActions.ts"),
  "utf8",
);

/** The single `const NAME = "1.2.3"` a file declares, or null. */
function pinnedVersion(source: string, constantName: string): string | null {
  return source.match(new RegExp(`${constantName} = "([^"]+)"`))?.[1] ?? null;
}

const sdkVersions = [
  {
    packageName: "@anthropic-ai/claude-agent-sdk",
    version: "0.3.201",
    versionConstant: "CLAUDE_AGENT_SDK_VERSION",
    loader: claudeLoader,
  },
  {
    packageName: "@cursor/sdk",
    version: "1.0.26",
    versionConstant: "CURSOR_SDK_VERSION",
    loader: cursorLoader,
  },
];

test("provider SDK dependencies match the callback loader versions", () => {
  for (const sdk of sdkVersions) {
    expect(backendPackage).toContain(`"${sdk.packageName}": "${sdk.version}"`);
    expect(sdk.loader).toContain(`const SDK_PACKAGE = "${sdk.packageName}"`);
    expect(sdk.loader).toContain(`const SDK_VERSION = "${sdk.version}"`);
  }
});

test("provider boundaries use official SDK declarations", () => {
  expect(claudeLoader).toMatch(
    /import type \{[^}]*\} from "@anthropic-ai\/claude-agent-sdk"/,
  );
  expect(claudeLoader).toContain("SdkModule = { query: typeof query }");
  expect(cursorLoader).toMatch(/import type \{[^}]*\} from "@cursor\/sdk"/);
  expect(cursorLoader).toContain("Cursor: typeof Cursor");
});

test("new snapshots preinstall both provider SDKs at the loader versions", () => {
  for (const sdk of sdkVersions) {
    // Version-pinned, never existence-only. A snapshot seeded before a pin
    // moved would otherwise keep serving an SDK whose message shapes the
    // callback's parsers do not recognise, which reads as a turn that streams
    // no activity at all rather than as an error.
    expect(snapshotActions).toContain(
      `const ${sdk.versionConstant} = "${sdk.version}"`,
    );
    expect(snapshotActions).toContain(
      `globalPackageIsVersion("${sdk.packageName}", ${sdk.versionConstant})`,
    );
    expect(snapshotActions).toContain(
      `${sdk.packageName}@\${${sdk.versionConstant}}`,
    );
  }
});

test("every loader resolves its pin through one version-aware helper", () => {
  // The helper lives in the Claude loader; the others import it.
  expect(claudeLoader).toContain("export function resolvePinnedSdkEntry(");
  expect(claudeLoader).toContain("if (globalVersion === pin.version)");
  for (const loader of [
    ...sdkVersions.map((sdk) => sdk.loader),
    opencodeLoader,
  ]) {
    expect(loader).toContain("resolvePinnedSdkEntry({");
    expect(loader).toContain("version: SDK_VERSION,");
  }
});

/**
 * opencode is the one provider whose SDK is never a backend dependency — the
 * seed installs it globally alongside a matching launcher, so the pin the loader
 * demands and the version the seed installs live in two files with only a
 * comment holding them together. Drift is silent and one-directional: the
 * loader rejects the global as off-pin, and every turn quietly reinstalls a
 * user-local copy instead of using the seeded one.
 */
test("the opencode loader's pin matches the version the seed installs", () => {
  const loaderPin = pinnedVersion(opencodeLoader, "SDK_VERSION");
  expect(loaderPin, "the opencode loader's pin moved or was renamed").not.toBe(
    null,
  );
  expect(pinnedVersion(snapshotActions, "OPENCODE_VERSION")).toBe(loaderPin);
});

test("the seed's opencode install is version-checked, not existence-checked", () => {
  expect(snapshotActions).toContain(
    'globalPackageIsVersion("@opencode-ai/sdk", OPENCODE_VERSION)',
  );
  // The launcher and its generated client must move together — the SDK is
  // generated against one server release.
  expect(snapshotActions).toContain("opencode-ai@${OPENCODE_VERSION}");
  expect(snapshotActions).toContain("@opencode-ai/sdk@${OPENCODE_VERSION}");
});

test("older snapshots retain the user-local SDK fallback", () => {
  expect(claudeLoader).toContain(
    'const SDK_LOCAL_PREFIX = "/home/eva/.eva-agent-sdk"',
  );
  expect(claudeLoader).toContain("npm install --prefix");
});
