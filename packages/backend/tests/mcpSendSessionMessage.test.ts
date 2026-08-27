import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../convex/_generated/api";
import schema from "../convex/schema";
import { canonicalPrUrl } from "../convex/mcp/sessionRef";
import {
  buildSessionMessageCalls,
  resolveAgentDelivery,
} from "../convex/mcp/orchestratorDelivery";

const modules = import.meta.glob("../convex/**/*.ts");
const testsDir = dirname(fileURLToPath(import.meta.url));

function convexSource(path: string): string {
  return readFileSync(join(testsDir, "../convex", path), "utf8");
}

const PR_URL = "https://github.com/vvedantb/eva/pull/664";

/** Owner with one session on a PR, plus an unrelated user who owns nothing. */
async function fixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const ownerUserId = await ctx.db.insert("users", {});
    const strangerUserId = await ctx.db.insert("users", {});
    const repoId = await ctx.db.insert("githubRepos", {
      owner: "vvedantb",
      name: "eva",
      installationId: 1,
      connectedBy: ownerUserId,
    });
    const otherRepoId = await ctx.db.insert("githubRepos", {
      owner: "someone",
      name: "else",
      installationId: 2,
      connectedBy: strangerUserId,
    });
    const sessionId = await ctx.db.insert("sessions", {
      repoId,
      userId: ownerUserId,
      title: "Fix the login bug",
      status: "active",
      numId: 42,
      prUrl: PR_URL,
      branchName: "eva/session-login",
    });
    const strangerSessionId = await ctx.db.insert("sessions", {
      repoId: otherRepoId,
      userId: strangerUserId,
      title: "Not yours",
      status: "active",
      numId: 7,
    });
    return {
      ownerUserId,
      strangerUserId,
      repoId,
      otherRepoId,
      sessionId,
      strangerSessionId,
    };
  });
  return { t, ...ids };
}

describe("resolving the session an MCP caller named", () => {
  test("the owner reaches their session by Convex id, PR url, and numId", async () => {
    const f = await fixture();

    for (const ref of [
      { sessionId: f.sessionId },
      { prUrl: PR_URL },
      { numId: 42, repoId: f.repoId },
    ]) {
      const resolved = await f.t.query(
        internal.mcp.queries.resolveSessionForUser,
        { userId: f.ownerUserId, ...ref },
      );
      expect(resolved?.sessionId).toBe(f.sessionId);
      expect(resolved?.repoOwner).toBe("vvedantb");
      expect(resolved?.numId).toBe(42);
      expect(resolved?.prUrl).toBe(PR_URL);
    }
  });

  test("a session in a repo the caller cannot reach resolves to nothing", async () => {
    const f = await fixture();
    // Named exactly right — the only thing missing is access, and the answer is
    // the same null a bogus id gets, so no session is confirmed to exist.
    const resolved = await f.t.query(
      internal.mcp.queries.resolveSessionForUser,
      { userId: f.ownerUserId, sessionId: f.strangerSessionId },
    );
    expect(resolved).toBeNull();
  });

  test("a numId is not enough on its own, and belongs to its own repo only", async () => {
    const f = await fixture();
    expect(
      await f.t.query(internal.mcp.queries.resolveSessionForUser, {
        userId: f.ownerUserId,
        numId: 42,
      }),
    ).toBeNull();
    expect(
      await f.t.query(internal.mcp.queries.resolveSessionForUser, {
        userId: f.ownerUserId,
        numId: 42,
        repoId: f.otherRepoId,
      }),
    ).toBeNull();
  });

  test("an unknown reference and a soft-deleted session both resolve to nothing", async () => {
    const f = await fixture();
    expect(
      await f.t.query(internal.mcp.queries.resolveSessionForUser, {
        userId: f.ownerUserId,
        sessionId: "not-an-id",
      }),
    ).toBeNull();
    expect(
      await f.t.query(internal.mcp.queries.resolveSessionForUser, {
        userId: f.ownerUserId,
        prUrl: "https://github.com/vvedantb/eva/pull/999",
      }),
    ).toBeNull();

    await f.t.run(async (ctx) => {
      await ctx.db.patch(f.sessionId, { deletedAt: Date.now() });
    });
    expect(
      await f.t.query(internal.mcp.queries.resolveSessionForUser, {
        userId: f.ownerUserId,
        sessionId: f.sessionId,
      }),
    ).toBeNull();
  });

  test("a teammate on the repo's team reaches the session too", async () => {
    const f = await fixture();
    const teammateUserId = await f.t.run(async (ctx) => {
      const teamId = await ctx.db.insert("teams", {
        name: "Eva",
        createdBy: f.ownerUserId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(f.repoId, { teamId });
      const userId = await ctx.db.insert("users", {});
      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "member",
        joinedAt: Date.now(),
      });
      return userId;
    });

    const resolved = await f.t.query(
      internal.mcp.queries.resolveSessionForUser,
      { userId: teammateUserId, prUrl: PR_URL },
    );
    expect(resolved?.sessionId).toBe(f.sessionId);
  });
});

describe("PR links the tool accepts", () => {
  test("review tails, query strings, and anchors all canonicalise", () => {
    for (const input of [
      PR_URL,
      `${PR_URL}/`,
      `${PR_URL}/files`,
      `${PR_URL}/commits/abc123`,
      `${PR_URL}?diff=split`,
      `${PR_URL}#issuecomment-1`,
      "github.com/vvedantb/eva/pull/664",
      "http://www.github.com/vvedantb/eva/pull/664",
      "  https://github.com/vvedantb/eva/pull/664  ",
    ]) {
      expect(canonicalPrUrl(input)).toBe(PR_URL);
    }
  });

  test("anything that is not a PR link is rejected rather than guessed at", () => {
    for (const input of [
      "https://github.com/vvedantb/eva",
      "https://github.com/vvedantb/eva/issues/664",
      "https://gitlab.com/vvedantb/eva/pull/664",
      "664",
      "",
    ]) {
      expect(canonicalPrUrl(input)).toBeNull();
    }
  });
});

describe("what a send does to the session", () => {
  test("an idle session gets a user message and then a turn", () => {
    const calls = buildSessionMessageCalls({
      sessionId: "s1",
      message: "keep going",
      delivery: resolveAgentDelivery({ isBusy: false, storedModel: "opus" }),
      sentViaOrchestrator: false,
    });

    expect(calls.map((call) => call.fn)).toEqual([
      "_sessions/mutations:addMessage",
      "_sessions/execution:startExecute",
    ]);
    expect(calls[0]?.args).toEqual({
      id: "s1",
      role: "user",
      content: "keep going",
      model: "claude:opus",
      sentViaOrchestrator: false,
    });
    expect(calls[1]?.args).toEqual({
      sessionId: "s1",
      message: "keep going",
      model: "claude:opus",
    });
  });

  test("a busy session queues one message instead of starting a second turn", () => {
    const calls = buildSessionMessageCalls({
      sessionId: "s1",
      message: "and this next",
      delivery: resolveAgentDelivery({ isBusy: true }),
      sentViaOrchestrator: true,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.fn).toBe("_sessions/execution:enqueueMessage");
    expect(calls[0]?.args.sessionId).toBe("s1");
    expect(calls[0]?.args.sentViaOrchestrator).toBe(true);
  });

  test("no send path creates a task or a session", () => {
    const everyCall = [false, true].flatMap((isBusy) =>
      buildSessionMessageCalls({
        sessionId: "s1",
        message: "hi",
        delivery: resolveAgentDelivery({ isBusy }),
        sentViaOrchestrator: false,
      }),
    );
    for (const call of everyCall) {
      expect(call.fn.startsWith("_sessions/")).toBe(true);
      expect(call.fn).not.toContain("create");
      expect(call.fn).not.toContain("agentTask");
    }
  });

  test("no argument is sent that the session mutations do not declare", () => {
    // Sessions lost their plan/edit `mode` long ago, but the MCP send kept
    // passing one. Convex rejects an argument no validator declares, so that
    // leftover failed the whole send.
    const args = [false, true].flatMap((isBusy) =>
      buildSessionMessageCalls({
        sessionId: "s1",
        message: "hi",
        delivery: resolveAgentDelivery({ isBusy }),
        sentViaOrchestrator: false,
      }).flatMap((call) => Object.keys(call.args)),
    );
    expect(args).not.toContain("mode");
  });
});

describe("which tokens get which tools", () => {
  const tools = convexSource("mcp/tools.ts");
  const orchestratorTools = convexSource("mcp/orchestratorTools.ts");

  test("send_session_message is registered for every MCP caller", () => {
    // Registered in tools.ts, above the isOrchestrator gate at the bottom —
    // that ordering is what puts it on a plain OAuth connector's tool list.
    const registered = tools.indexOf('"send_session_message"');
    const gate = tools.indexOf("if (isOrchestrator) {");
    expect(registered).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(registered);
    expect(orchestratorTools).not.toContain('"send_session_message"');
  });

  test("the orchestrator's fleet tools stay behind the gate", () => {
    for (const name of [
      '"list_agents"',
      '"get_agent_state"',
      '"send_agent_message"',
      '"stop_agent"',
      '"create_session"',
      '"watch_agent"',
    ]) {
      expect(orchestratorTools).toContain(name);
      expect(tools).not.toContain(name);
    }
    expect(tools).toContain(
      "if (isOrchestrator) {\n    registerOrchestratorTools(server, credentials, ctx);",
    );
  });

  test("the send checks repo access before it sends", () => {
    const start = tools.indexOf('"send_session_message"');
    const body = tools.slice(start, tools.indexOf('"create_eva_doc"'));
    const accessCheck = body.indexOf("assertRepoAccess(session.repoId");
    const send = body.indexOf("orchestratorSendMessage");
    expect(accessCheck).toBeGreaterThan(-1);
    expect(send).toBeGreaterThan(accessCheck);
  });
});
