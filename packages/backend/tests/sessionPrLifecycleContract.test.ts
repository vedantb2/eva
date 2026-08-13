import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const source = stripComments(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../convex/githubWebhook.ts"),
    "utf8",
  ),
);
const derive = functionBody(source, "function deriveSessionPrState(");
const handler = definitionBody(source, "handleSessionPrEvent");

describe("session pull-request lifecycle", () => {
  test("distinguishes merged closes from unmerged closes", () => {
    expect(derive).toContain('return merged ? "merged" : "closed"');
  });

  test("maps draft, ready, open and reopen events", () => {
    expect(derive).toContain('action === "converted_to_draft"');
    expect(derive).toContain('action === "ready_for_review"');
    expect(derive).toContain('action === "opened" || action === "reopened"');
  });

  test("archives both terminal states and unarchives every live state", () => {
    expect(handler).toContain("const isTerminal = nextState === \"merged\" || nextState === \"closed\"");
    expect(handler).toContain("archived: true");
    expect(handler).toContain("archived: false");
    expect(handler).toContain("prStateOnArchive: undefined");
  });

  test("stops a terminal session before scheduling its grace deletion", () => {
    const stopAt = handler.indexOf("requestSessionSandboxStop(");
    const deleteAt = handler.indexOf("scheduleSessionSandboxGraceDelete(");
    expect(stopAt).toBeGreaterThan(-1);
    expect(deleteAt).toBeGreaterThan(stopAt);
  });

  test("only schedules deletion for a newly archived session", () => {
    expect(handler).toContain(
      "const needsArchive = isTerminal && session.archived !== true",
    );
    expect(handler).toContain("if (needsArchive) {");
  });

  test("reopen cancels an already scheduled deletion", () => {
    expect(handler).toContain(
      "const needsUnarchive = !isTerminal && session.archived === true",
    );
    expect(handler).toContain("cancelSessionSandboxGraceDelete(");
  });

  test("merged verification is fenced by PR number and merge SHA", () => {
    const verifyAt = handler.indexOf("internal.github.verifySessionPrMerged");
    expect(verifyAt).toBeGreaterThan(-1);
    const gate = handler.slice(Math.max(0, verifyAt - 500), verifyAt);
    expect(gate).toContain('nextState === "merged"');
    expect(gate).toContain("args.prNumber !== undefined");
    expect(gate).toContain("args.mergeCommitSha !== undefined");
  });
});

describe("session archive closes a live PR", () => {
  const mutations = stripComments(
    readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../convex/_sessions/mutations.ts",
      ),
      "utf8",
    ),
  );
  const archive = definitionBody(mutations, "archive");
  const unarchive = definitionBody(mutations, "unarchive");

  test("archive closes open/draft PRs and remembers that state", () => {
    expect(archive).toContain("livePrState(session.prState)");
    expect(archive).toContain('kind: "close"');
    expect(archive).toContain("prStateOnArchive: restorePrState");
    expect(archive).not.toContain("reopenPullRequest");
  });

  test("unarchive reopens only a PR Eva closed, skipping merged", () => {
    expect(unarchive).toContain("livePrState(session.prStateOnArchive)");
    expect(unarchive).toContain('session.prState !== "merged"');
    expect(unarchive).toContain('kind: "reopen"');
    expect(unarchive).toContain('asReady: restorePrState === "open"');
  });
});

function definitionBody(input: string, name: string): string {
  const startAt = input.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const endAt = input.indexOf("\n});", startAt);
  return input.slice(startAt, endAt < 0 ? undefined : endAt);
}

function functionBody(input: string, declaration: string): string {
  const startAt = input.indexOf(declaration);
  expect(startAt, `${declaration} moved or was renamed`).toBeGreaterThan(-1);
  const endAt = input.indexOf("\n}", startAt);
  return input.slice(startAt, endAt < 0 ? undefined : endAt);
}

function stripComments(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
