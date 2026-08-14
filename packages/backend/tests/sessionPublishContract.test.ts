import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

const sessionWorkflow = readSource("_sessions/workflow.ts");
const resultTarget = readSource("_sessions/resultTarget.ts");
const sandboxExecution = readSource("_sandbox_runtime/execution.ts");
const sandboxGit = readSource("_sandbox_runtime/git.ts");
const turnPersist = readSource("../callback-src/runtime/turnPersist.ts");
const claudeSdkDaemon = readSource(
  "../callback-src/providers/claudeSdkDaemon.ts",
);

const PUSH_ACTION = "internal.sandbox.pushSandboxBranch";

/**
 * Eva owns publishing: the agent commits inside the sandbox and is told not to
 * push. Gating the push on a dirty tree therefore skipped it on every
 * *successful* run — a proper commit leaves the tree clean — so the work stayed
 * in the sandbox and never reached GitHub (fix c7df1ff2, again in 0fdcf11d).
 */
describe("a successful turn always publishes", () => {
  test("no workflow gates a push on a dirty tree", () => {
    const gated = convexFiles().filter((path) => {
      const source = readSource(path);
      return (
        source.includes(PUSH_ACTION) && source.includes("status --porcelain")
      );
    });
    expect(gated, "a clean tree is the normal success case").toEqual([]);
  });

  test("the session push is conditioned only on mode, success and branch", () => {
    const condition = sessionWorkflow.slice(
      sessionWorkflow.lastIndexOf("if (", sessionWorkflow.indexOf(PUSH_ACTION)),
      sessionWorkflow.indexOf(PUSH_ACTION),
    );
    expect(condition).toContain("result.success");
    expect(condition).toContain("data.branchName");
    expect(condition).not.toContain("porcelain");
    expect(condition).not.toContain("isDirty");
  });
});

/**
 * The push action used to swallow its own errors, which made every caller's
 * catch block dead code and reported failed pushes as successes (fix c7df1ff2).
 */
describe("push failures reach their callers", () => {
  test("pushSandboxBranch rethrows", () => {
    const body = definitionBody(sandboxExecution, "pushSandboxBranch");
    const catchAt = body.indexOf("} catch (error) {");
    expect(catchAt, "the push error handler moved").toBeGreaterThan(-1);
    expect(body.indexOf("throw error;", catchAt)).toBeGreaterThan(catchAt);
  });

  /** A rethrow with an unguarded call site kills the whole workflow step. */
  test("every call site handles the throw", () => {
    const sites: string[] = [];
    const unguarded: string[] = [];
    for (const path of convexFiles()) {
      const source = readSource(path);
      let at = source.indexOf(PUSH_ACTION);
      while (at > -1) {
        sites.push(`${path}:${at}`);
        const tryAt = source.lastIndexOf("try {", at);
        const catchAt = source.indexOf("} catch", at);
        if (tryAt < 0 || catchAt < 0) unguarded.push(`${path}:${at}`);
        at = source.indexOf(PUSH_ACTION, at + 1);
      }
    }
    // A scan that found nothing would satisfy the assertion below for free.
    expect(
      sites.length,
      "the push action moved or was renamed",
    ).toBeGreaterThan(5);
    expect(
      unguarded,
      "wrap the push so a failure surfaces as an alert",
    ).toEqual([]);
  });
});

/**
 * A push can hang for minutes. Saving the reply first is what stops the chat
 * sitting on "Working…" after the daemon has already finished (fix 27bef8e0).
 */
describe("the reply is saved before the push", () => {
  test("saveResult runs first", () => {
    const saveAt = sessionWorkflow.indexOf(
      "internal.sessionWorkflow.saveResult",
    );
    expect(saveAt, "saveResult moved or was renamed").toBeGreaterThan(-1);
    expect(saveAt).toBeLessThan(sessionWorkflow.indexOf(PUSH_ACTION));
  });

  /**
   * The failure is then reported as its own alert, which only works because
   * saveResult recognises the prefix the workflow produces. A typo in either
   * literal makes the second saveResult run the generic finaliser again and
   * replace the saved answer with "Error: …".
   */
  test("saveResult recognises the publish-failure message it is sent", () => {
    const marker = resultTarget.match(
      /SESSION_PUBLISH_FAILURE_PREFIX =\s*"([^"]+)"/,
    );
    expect(marker, "the publish-failure prefix moved").not.toBeNull();
    const prefix = marker?.[1] ?? "";
    expect(prefix.length).toBeGreaterThan(0);
    const thrown = sessionWorkflow.match(/const publishError = `([^${]+)/);
    expect(thrown, "the publish-failure message moved").not.toBeNull();
    expect(thrown?.[1] ?? "").toContain(prefix);
  });
});

/**
 * Because the reply is saved before the push, a push failure arrives late —
 * often after the next regular or queued turn has started. Re-running the
 * generic finaliser then patched the NEWER turn's placeholder with the
 * previous answer, cleared its live streaming row and wiped its
 * activeWorkflowId (fix 60a9b977).
 */
describe("a delayed publish failure cannot rewrite a newer turn", () => {
  test("saveResult isolates the failure before touching turn state", () => {
    const body = definitionBody(sessionWorkflow, "saveResult");
    const guardAt = body.indexOf("delayedPublishFailureError(");
    const clearAt = body.indexOf("clearStreamingActivity(");
    const targetAt = body.indexOf("resultTargetMessage(");
    expect(guardAt, "the publish-failure guard moved").toBeGreaterThan(-1);
    expect(clearAt, "the streaming clear moved").toBeGreaterThan(-1);
    expect(targetAt, "the result target lookup moved").toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(clearAt);
    expect(guardAt).toBeLessThan(targetAt);
  });

  test("the failure becomes a standalone system alert", () => {
    const body = definitionBody(sessionWorkflow, "saveResult");
    const guard = body.slice(
      body.indexOf("delayedPublishFailureError("),
      body.indexOf("clearStreamingActivity("),
    );
    expect(guard).toContain("isSystemAlert: true");
    expect(guard).toContain("return null;");
  });
});

/**
 * The counterpart to "a successful turn always publishes": a turn that made no
 * commits (chat/Q&A) must publish NOTHING. Its first push would create the
 * remote branch — a ref update that runs the target repo's pre-push hooks in a
 * fresh sandbox where generated artefacts (Next.js route types, say) don't
 * exist — so chat-only sessions spammed publish-failure alerts. The gate asks
 * whether HEAD carries commits origin lacks; a dirty-tree check stays banned
 * (see the porcelain rule above).
 */
describe("an empty turn publishes nothing", () => {
  test("the push gates on commits origin lacks, not a dirty tree", () => {
    const body = functionBody(
      sandboxGit,
      "export async function pushBranchToOrigin(",
    );
    const gateAt = body.indexOf(
      "git rev-list --count HEAD --not ${exclusion}",
    );
    const pushAt = body.indexOf("git push");
    expect(gateAt, "the ahead-of-remote gate moved").toBeGreaterThan(-1);
    expect(pushAt, "the push moved").toBeGreaterThan(-1);
    expect(gateAt).toBeLessThan(pushAt);
    expect(body).toContain('const exclusion = remoteExists');
    expect(body).toContain(': "--remotes=origin";');
    expect(body).not.toContain("porcelain");
  });
});

/**
 * A preserved or resumed sandbox can have local-only commits while another
 * callback/sandbox has advanced the same stable session branch. A blind push
 * is then rejected with "fetch first". Publication must refresh that exact
 * ref, preserve local work, and retry after incorporating the remote tip.
 */
describe("session branch publication reconciles concurrent remote work", () => {
  test("the backend fetches and reconciles before its ahead gate and push", () => {
    const sync = functionBody(
      sandboxGit,
      "async function synchronizeBranchForPublish(",
    );
    const fetchAt = sync.indexOf("fetchBranchRefs(");
    const divergenceAt = sync.indexOf("git rev-list --left-right --count");
    expect(fetchAt).toBeGreaterThan(-1);
    expect(divergenceAt).toBeGreaterThan(fetchAt);
    expect(sync).toContain("git merge --ff-only");
    expect(sync).toContain("git rebase ${quotedRemoteRef}");
    expect(sync).toContain("git rebase --abort");
    expect(sync).toContain("git update-ref -d");

    const push = functionBody(
      sandboxGit,
      "export async function pushBranchToOrigin(",
    );
    const syncAt = push.indexOf("synchronizeBranchForPublish(");
    const gateAt = push.indexOf("git rev-list --count HEAD --not");
    const pushAt = push.indexOf("git push");
    expect(syncAt).toBeGreaterThan(-1);
    expect(syncAt).toBeLessThan(gateAt);
    expect(gateAt).toBeLessThan(pushAt);
    expect(push).toContain("isNonFastForwardPushError(message)");
  });

  test("resuming prefers a preserved local branch over a stale remote ref", () => {
    const resolveAt = sandboxGit.indexOf(
      "async function resolveBranchStartTarget(",
    );
    const localAt = sandboxGit.indexOf(
      'return { ref: branchName, source: "localBranch" };',
      resolveAt,
    );
    const remoteAt = sandboxGit.indexOf(
      'return { ref: `origin/${branchName}`, source: "remoteBranch" };',
      resolveAt,
    );
    expect(resolveAt).toBeGreaterThan(-1);
    expect(localAt).toBeGreaterThan(-1);
    expect(remoteAt).toBeGreaterThan(localAt);
  });

  test("the pre-completion durability push follows the same protocol", () => {
    const syncAt = turnPersist.indexOf("synchronizeForPush(branch.out)");
    const gateAt = turnPersist.indexOf('"rev-list",\n      "--count"');
    const pushAt = turnPersist.indexOf('git(["push", "origin", refspec]');
    expect(turnPersist).toContain('"fetch",\n      "--no-tags"');
    expect(turnPersist).toContain('git(["rebase", remoteRef]');
    expect(turnPersist).toContain('git(["rebase", "--abort"]');
    expect(syncAt).toBeGreaterThan(-1);
    expect(syncAt).toBeLessThan(gateAt);
    expect(gateAt).toBeLessThan(pushAt);
    expect(turnPersist).toContain("isNonFastForwardPush(push.out)");
  });
});

/**
 * The gate above is only half of it. `pushBranchToOrigin` returned `void`, so a
 * skipped push was indistinguishable from a real one and every workflow ran its
 * PR step against a branch origin never received — GitHub's compare 404s
 * through all retries and posts a spurious "Failed to create PR" alert (fix
 * 06963e8e, prod session 37, twice). The skip has to reach the callers, and
 * every PR step has to be gated on it.
 */
describe("a turn that pushed nothing opens no pull request", () => {
  /** Matches createPullRequest, createTaskPullRequest, refreshTaskPullRequestBody, createDraftSessionPr. */
  const PR_STEP = /internal\.[A-Za-z_.]*(?:PullRequest|SessionPr)[A-Za-z]*/;

  const pushBody = () =>
    functionBody(sandboxGit, "export async function pushBranchToOrigin(");

  test("pushBranchToOrigin reports which of the two paths it took", () => {
    const body = pushBody();
    const skipAt = body.indexOf(
      "return { pushed: false, published: remoteExists };",
    );
    const pushAt = body.indexOf("git push");
    const pushedAt = body.indexOf(
      "return { pushed: true, published: true };",
    );
    expect(skipAt, "the skip no longer reports itself").toBeGreaterThan(-1);
    expect(pushedAt, "the push no longer reports itself").toBeGreaterThan(-1);
    expect(skipAt, "the skip belongs before the push").toBeLessThan(pushAt);
    expect(pushAt).toBeLessThan(pushedAt);
  });

  /**
   * Both returns sit inside the logged step's callback, so awaiting that step
   * without returning its value hands every caller `undefined` — which reads as
   * "did not push" to an `if (result.pushed)` and as a crash to `result.pushed`.
   */
  test("the logged step's value is returned, not just awaited", () => {
    expect(
      pushBody(),
      "an awaited-but-unreturned step drops the outcome",
    ).toContain("return await runLoggedGitStep(");
  });

  /**
   * Convex strips anything the `returns` validator does not describe, so a
   * stale `v.null()` here would hand every caller `null` back — the original
   * bug, reintroduced with the function above still correct.
   */
  test("pushSandboxBranch declares the object it returns", () => {
    const returns = definitionBody(sandboxExecution, "pushSandboxBranch").match(
      /returns:\s*([^\n]+)/,
    );
    expect(returns, "the returns validator moved").not.toBeNull();
    expect(returns?.[1] ?? "").toContain(
      "v.object({ pushed: v.boolean(), published: v.boolean() })",
    );
  });

  /**
   * The fan-out that actually regresses: a sixth workflow, or a refactor that
   * stops threading the result through, silently brings the 404 alerts back.
   * Push-only callers have no PR step and are left alone.
   */
  test("every workflow that pushes and opens a PR gates on the result", () => {
    const gated: string[] = [];
    const ungated: string[] = [];
    for (const path of convexFiles()) {
      const source = readSource(path);
      const prAt = source.search(PR_STEP);
      if (!source.includes(PUSH_ACTION) || prAt < 0) continue;
      const pushedAt = source.indexOf(".pushed");
      if (pushedAt > -1 && pushedAt < prAt) gated.push(path);
      else ungated.push(path);
    }
    // A scan that found nothing would satisfy the assertion below for free.
    expect(gated.length + ungated.length, "the push action moved").toBe(5);
    expect(
      ungated,
      "open the PR only when the push reported pushed: true",
    ).toEqual([]);
  });
});

/**
 * Session callbacks push work before completion so a VM death cannot erase a
 * finished turn. The later workflow push must recognise that exact remote head
 * or it suppresses the automatic draft PR (prod session 38).
 */
describe("a callback-published session still opens its first pull request", () => {
  test("the Claude callback persists work before reporting completion", () => {
    const persistAt = claudeSdkDaemon.indexOf("persistTurnWork();");
    const completionAt = claudeSdkDaemon.indexOf(
      "await deliverCompletionWithMedia(completionArgs);",
    );
    expect(persistAt, "the durability push moved").toBeGreaterThan(-1);
    expect(completionAt, "the completion call moved").toBeGreaterThan(-1);
    expect(persistAt).toBeLessThan(completionAt);
    expect(turnPersist).toContain('git(["push", "origin", refspec]');
  });

  /**
   * `HEAD` and a bare branch name both resolve through repo state (the branch a
   * detached HEAD sits on, the configured upstream), so a session whose upstream
   * was left as `origin/<base>` could aim its publish at the base branch. Both
   * push paths name the exact ref instead.
   */
  test("both push paths push a fully-qualified refspec", () => {
    expect(turnPersist).toContain(
      "const refspec = `refs/heads/${branch.out}:refs/heads/${branch.out}`",
    );
    const body = functionBody(
      sandboxGit,
      "export async function pushBranchToOrigin(",
    );
    expect(body).toContain(
      "`refs/heads/${branchName}:refs/heads/${branchName}`",
    );
    expect(body, "HEAD resolves through repo state").not.toMatch(
      /git push[^`\n]*\bHEAD\b/,
    );
  });

  /**
   * `git checkout -B <branch> origin/<base>` tracks the START POINT, which left
   * the working branch's upstream as `origin/<base>` — the shape that made a
   * bare `git push` fatal (or aim at the base branch) and `git pull` rebase onto
   * it. Both branch-setup paths must create with `--no-track` and pin the
   * upstream to the branch's own name.
   */
  test("branch setup pins the upstream to the working branch", () => {
    for (const entry of [
      "export async function checkoutSessionBranch(",
      "export async function setupBranch(",
    ]) {
      const body = functionBody(sandboxGit, entry);
      expect(body, `${entry} lost --no-track`).toContain("--no-track");
      expect(body, `${entry} lost the upstream pin`).toContain(
        "pinBranchUpstream(sandbox, branchName)",
      );
    }
    const pin = functionBody(sandboxGit, "async function pinBranchUpstream(");
    expect(pin).toContain("branch.${branchName}.remote");
    expect(pin).toContain("refs/heads/${branchName}");
  });

  /**
   * The dev server regenerates files (routeTree.gen.ts) between the snapshot
   * reset and the session-branch checkout; when the base ref moved past the
   * snapshot and touches those files, a plain `checkout -b` aborts, the run
   * proceeds on the base branch, and publish strands the work (prod sessions
   * eva/65 and eva/66). Creation only runs on fresh sandboxes with no user
   * work, so both arms must force.
   */
  test("session branch creation forces past re-dirtied snapshot files", () => {
    const body = functionBody(
      sandboxGit,
      "export async function checkoutSessionBranch(",
    );
    expect(body, "remote arm lost -f").toContain(
      "git checkout -f -b ${quotedBranch} ${quotedRemoteBranch}",
    );
    expect(body, "base fallback arm lost -f").toContain(
      "git checkout -f --no-track -b ${quotedBranch} ${quotedBase}",
    );
  });

  /**
   * When the startup checkout failed anyway (older sandbox, new failure mode),
   * publish must recover the unambiguous shape instead of stranding the work:
   * no local session branch means every local commit is the session's, so the
   * branch is created at HEAD (touches no files) and publication proceeds.
   * Anything else — detached HEAD, or a session branch that exists but is not
   * checked out — still refuses.
   */
  test("publish heals a session stranded on its base branch", () => {
    const body = functionBody(
      sandboxGit,
      "async function synchronizeBranchForPublish(",
    );
    const healGate = "git show-ref --verify --quiet ${quotedLocalHeadRef}";
    expect(body, "heal gate lost its local-branch probe").toContain(healGate);
    expect(body, "heal lost its no-touch branch creation").toContain(
      "git switch -c ${quote([branchName])}",
    );
    expect(body, "healed branch lost its upstream pin").toContain(
      "pinBranchUpstream(sandbox, branchName)",
    );
    expect(body, "detached HEAD must still refuse").toContain(
      'currentBranch === ""',
    );
    expect(body, "ambiguous shapes must still refuse").toContain(
      "Refusing to publish",
    );
  });

  test("the post-completion push reports an already-published branch", () => {
    const body = functionBody(
      sandboxGit,
      "export async function pushBranchToOrigin(",
    );
    expect(body).toContain("refs/remotes/origin/${branchName}");
    expect(body).toContain(
      "return { pushed: false, published: remoteExists };",
    );
    expect(body).toContain("return { pushed: true, published: true };");
  });

  test("a published branch recovers only a missing session PR", () => {
    expect(sessionWorkflow).toContain(
      "pushedCommits || (branchPublished && data.prUrl === undefined)",
    );
  });
});

/** Comments name the very calls these rules rule out, so they have to go first. */
function readSource(relativePath: string): string {
  return stripComments(
    readFileSync(join(convexDir, relativePath), "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
}

function convexFiles(): string[] {
  return readdirSync(convexDir, { recursive: true })
    .map((entry) => String(entry).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".ts"))
    .filter((path) => !path.includes("_generated"));
}

/** One top-level function, ending on the `\n}` that closes it at column 0. */
function functionBody(source: string, header: string): string {
  const startAt = source.indexOf(header);
  expect(startAt, `${header} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n}", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

/** One Convex definition, ending on the `\n});` that closes it. */
function definitionBody(source: string, name: string): string {
  const startAt = source.indexOf(`export const ${name} =`);
  expect(startAt, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const end = source.indexOf("\n});", startAt);
  return source.slice(startAt, end < 0 ? undefined : end);
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[^\S\n]*\/\/.*$/gm, "");
}
