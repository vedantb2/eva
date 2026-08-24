import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectChatSource = readSource("../convex/projectChatWorkflow.ts");
const executionSource = readSource(
  "../convex/_sandbox_runtime/execution.ts",
);
const envResolverSource = readSource("../convex/envVarResolver.ts");
const projectPanelSource = readSource(
  "../../../apps/web/src/lib/components/projects/ProjectSandboxChatPanel.tsx",
);

describe("project chat provider account handoff", () => {
  test("the requested account is validated and becomes the staged turn account", () => {
    const startExecute = exportBody(projectChatSource, "startExecute");
    expect(startExecute).toContain("resolveProjectTurnProviderAccountId(");
    expect(startExecute).toContain("providerAccountId,");
    expect(startExecute).not.toContain("void args.providerAccountId");
    expect(startExecute).not.toContain(
      "providerAccountId: project.providerAccountId",
    );
  });

  test("queued turns and credential badges use the validated account", () => {
    const addMessage = exportBody(projectChatSource, "addMessage");
    const enqueueMessage = exportBody(projectChatSource, "enqueueMessage");
    expect(addMessage).toContain("resolveProjectTurnProviderAccountId(");
    expect(addMessage).toContain("providerAccountId,");
    expect(enqueueMessage).toContain("resolveProjectTurnProviderAccountId(");
    expect(enqueueMessage).toContain("providerAccountId,");
  });

  test("daemon identity includes both account id and credential revision", () => {
    const signature = functionBody(executionSource, "buildDaemonOptsSig");
    expect(signature).toContain("providerAccountId: string | undefined");
    expect(signature).toContain(
      "providerAccountCredentialRevision: number | undefined",
    );
    expect(signature).toContain("${providerAccountId ?? \"\"}");
    expect(signature).toContain(
      "${providerAccountCredentialRevision ?? \"\"}",
    );
  });

  test("the composer waits for the replacement daemon before sending again", () => {
    expect(projectPanelSource).toContain("await prewarmChatDaemonNow({ projectId })");
    expect(projectPanelSource).toContain(
      "isInputDisabled={!isSandboxActive || isSwitchingAccount}",
    );
  });

  test("an invalid explicit account cannot fall back to Team", () => {
    const resolver = functionBody(
      envResolverSource,
      "resolveProviderAccountCredentials",
    );
    expect(resolver).toContain(
      'throw new Error("Selected provider account is no longer available")',
    );
    expect(resolver).toContain(
      'throw new Error("Selected provider account does not support this model")',
    );
    expect(resolver).not.toContain("falling back to team credential");
  });
});

function readSource(relativePath: string): string {
  return readFileSync(join(testsDir, relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

function exportBody(source: string, exportName: string): string {
  const declaration = `export const ${exportName} =`;
  const startAt = source.indexOf(declaration);
  expect(startAt, `${exportName} moved or was renamed`).toBeGreaterThan(-1);
  const rest = source.slice(startAt + declaration.length);
  const nextAt = rest.search(/\nexport const /);
  return declaration + (nextAt < 0 ? rest : rest.slice(0, nextAt));
}

function functionBody(source: string, functionName: string): string {
  const declaration = `function ${functionName}(`;
  const startAt = source.indexOf(declaration);
  expect(startAt, `${functionName} moved or was renamed`).toBeGreaterThan(-1);
  const rest = source.slice(startAt + declaration.length);
  const nextAt = rest.search(/\n(?:export |async function |function |const )/);
  return declaration + (nextAt < 0 ? rest : rest.slice(0, nextAt));
}
