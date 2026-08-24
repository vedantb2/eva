import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

function source(path: string): string {
  return readFileSync(join(convexDir, path), "utf8").replaceAll("\r\n", "\n");
}

function definitionBody(path: string, name: string): string {
  const text = source(path);
  const start = text.indexOf(`export const ${name} =`);
  expect(start, `${path}:${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = text.indexOf("\n});", start);
  return text.slice(start, end < 0 ? undefined : end);
}

describe("measured Convex I/O hot paths stay on compact reads", () => {
  test("claimPendingTurn polls the compact daemon row", () => {
    const body = definitionBody("_sessions/workflow.ts", "claimPendingTurn");
    expect(body).toContain('.query("sessionDaemonStates")');
    expect(body).toContain('withIndex("by_session"');
    expect(body).toContain("daemonState.pendingTurn");
    expect(body).not.toContain("session.pendingTurn");
  });

  test("every session daemon signal writer mirrors the compact row", () => {
    for (const path of [
      "_sessions/execution.ts",
      "_sessions/sandbox.ts",
      "_sessions/workflow.ts",
      "_chat/surfaceAdapters.ts",
    ]) {
      expect(source(path), path).toContain("syncSessionDaemonState");
    }
  });

  test("task lists use summaries and every run creator updates them", () => {
    const list = definitionBody("_agentTasks/queries.ts", "getAllTasks");
    expect(source("_agentTasks/queries.ts")).toContain(
      '.query("agentTaskRunSummaries")',
    );
    expect(list).toContain('withIndex("by_repo_status_and_deleted"');

    const runCreators = convexFiles().filter((path) =>
      source(path).includes('insert("agentRuns"'),
    );
    expect(runCreators.length).toBeGreaterThan(0);
    for (const path of runCreators) {
      expect(source(path), path).toContain("setTaskLastRunStartedAt");
    }
  });

  test("list filters are index ranges, not post-read filters", () => {
    const sessions = definitionBody("_sessions/queries.ts", "list");
    expect(sessions).toContain('withIndex("by_repo_archived_and_deleted"');
    expect(sessions).not.toContain(".filter(");

    const mentions = definitionBody("_mentions/listData.ts", "listData");
    expect(mentions).toContain('withIndex("by_repo_and_deleted"');
    expect(mentions).toContain('withIndex("by_repo_status_and_deleted"');
    expect(mentions).not.toContain("filterActiveEntities");
  });

  test("skill list metadata no longer writes new SKILL.md bodies inline", () => {
    const apply = definitionBody("repoSkills.ts", "applyGithubSync");
    expect(apply).toContain("upsertRepoSkillContent");
    expect(apply).toContain("content: undefined");
    expect(source("repoSkills.ts")).toContain('.query("repoSkillContents")');
    expect(source("dataMigrations.ts")).toContain("splitRepoSkillContent");
  });

  test("only the platform presence room reads users for lastSeenAt", () => {
    expect(source("presence.ts")).toContain(
      'const LAST_SEEN_ROOM_ID = "platform"',
    );
    const body = definitionBody("presence.ts", "heartbeat");
    expect(body).toContain("roomId === LAST_SEEN_ROOM_ID");
    expect(body).toContain("user.lastSeenAt");
  });

  test("listByParent skips storage URL work for text-only transcripts", () => {
    expect(source("_messages/media.ts")).toContain(
      "export function messageNeedsUrlResolution",
    );
    const messages = source("messages.ts");
    expect(messages).toContain("messageNeedsUrlResolution");
    expect(messages).toContain("messages.some(messageNeedsUrlResolution)");
  });
});

function convexFiles(): string[] {
  return readdirSync(convexDir, { recursive: true })
    .map((entry) => String(entry).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".ts"))
    .filter((path) => !path.includes("_generated"))
    .filter((path) => !path.endsWith(".generated.ts"));
}
