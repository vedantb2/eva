"use node";

/**
 * Vercel Sandbox implementation of the provider-neutral contract (./provider.ts).
 * Mirrors ./daytonaProvider.ts but targets `@vercel/sandbox` v2 (persistent
 * sandboxes, sub-second snapshot restore — see the Phase 0 spike results).
 *
 * Design notes / provider deltas vs Daytona:
 * - Identity: Vercel addresses sandboxes by `name`, not a separate id. We expose
 *   `handle.id === sandbox.name` and resolve `get(sandboxId)` via `Sandbox.get({ name })`.
 * - Resources: the neutral create params carry no vCPU count, so we default it
 *   (Vercel gives 2 GB RAM per vCPU). Override via SANDBOX_VERCEL_VCPUS if needed.
 * - Lifecycle: Vercel is persistent-by-default and auto-resumes on `get`, so
 *   `start()` is a no-op and `archive()` maps to `stop()` (stop auto-snapshots).
 * - git: no native git client — implemented over the shell via runCommand.
 * - PTY/desktop/volumes are intentionally omitted for now: Vercel's PTY is a
 *   client-connect WebSocket (`openInteractive`) rather than the push-callback
 *   model of the neutral SandboxPty, and Drives (volumes) are beta. These are
 *   the "wired last" capabilities called out in the contract; consumers that
 *   need them stay on Daytona until they're designed for both providers.
 */

import { Sandbox } from "@vercel/sandbox";
import type {
  CreateSnapshotParams,
  PreviewUrl,
  SandboxClient,
  SandboxCreateParams,
  SandboxExecOptions,
  SandboxExecResult,
  SandboxGit,
  SandboxHandle,
  SandboxProviderKind,
  SandboxSnapshotInfo,
  SandboxState,
} from "./provider";

/** Vercel API credentials, passed on every SDK call. */
interface VercelCredentials {
  token: string;
  teamId: string;
  projectId: string;
}

const DEFAULT_VCPUS = Number(process.env.SANDBOX_VERCEL_VCPUS ?? "4");
/** Vercel exposes at most 4 ports; default to the eva dev + proxy range if unset. */
const MAX_PORTS = 4;

/** Maps Vercel's session status onto the neutral {@link SandboxState}. */
function normalizeState(raw: string | undefined): SandboxState {
  switch (raw) {
    case "running":
      return "running";
    case "stopped":
    case "stopping":
    case "snapshotting":
      return "stopped";
    case "pending":
      return "starting";
    case "failed":
      return "error";
    case "aborted":
      return "gone";
    default:
      return "unknown";
  }
}

/** Maps a Vercel snapshot status onto the neutral snapshot status. */
function normalizeSnapshotStatus(raw: string): SandboxSnapshotInfo["status"] {
  if (raw === "created") return "ready";
  if (raw === "failed") return "error";
  return "pending";
}

/** Vercel git operations, implemented over the shell (no native git client). */
class VercelGit implements SandboxGit {
  constructor(private readonly sandbox: Sandbox) {}

  private async sh(cmd: string): Promise<string> {
    const c = await this.sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", cmd],
    });
    if (c.exitCode !== 0) {
      const err = await c.output("both").catch(() => "");
      throw new Error(
        `git shell failed (exit ${c.exitCode}): ${cmd}\n${err.slice(-2000)}`,
      );
    }
    return await c.stdout().catch(() => "");
  }

  async branches(workspaceDir: string): Promise<{ branches: string[] }> {
    const out = await this.sh(
      `cd ${workspaceDir} && git branch --format='%(refname:short)'`,
    );
    const branches = out
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
    return { branches };
  }

  async clone(
    url: string,
    dest: string,
    authUser: string,
    authToken: string,
  ): Promise<void> {
    // Inject credentials into the https URL (never logged). Falls back to the
    // bare URL if it is not an https github URL.
    const authed = url.startsWith("https://")
      ? url.replace("https://", `https://${authUser}:${authToken}@`)
      : url;
    await this.sh(`git clone ${authed} ${dest}`);
  }

  async checkoutBranch(
    workspaceDir: string,
    branchName: string,
  ): Promise<void> {
    await this.sh(`cd ${workspaceDir} && git checkout ${branchName}`);
  }
}

/** A handle to one Vercel sandbox, exposing the neutral {@link SandboxHandle}. */
class VercelSandboxHandle implements SandboxHandle {
  constructor(
    private sandbox: Sandbox,
    private readonly creds: VercelCredentials,
  ) {}

  /** Fresh git facade bound to the current session (refresh() swaps the sandbox). */
  get git(): SandboxGit {
    return new VercelGit(this.sandbox);
  }

  /** Migration escape hatch (see unwrapVercelSandbox). */
  unwrap(): Sandbox {
    return this.sandbox;
  }

  get id(): string {
    return this.sandbox.name;
  }
  get cpu(): number | undefined {
    return this.sandbox.vcpus;
  }
  get memory(): number | undefined {
    return this.sandbox.memory;
  }
  get disk(): number | undefined {
    // Vercel does not report a per-sandbox disk figure (fixed 32 GB ephemeral NVMe).
    return undefined;
  }
  get state(): SandboxState {
    return normalizeState(this.sandbox.status);
  }
  get errorReason(): string | null {
    // Vercel surfaces failure via status, not a reason string.
    return null;
  }

  async exec(
    cmd: string,
    opts?: SandboxExecOptions,
  ): Promise<SandboxExecResult> {
    const finished = await this.sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", cmd],
      ...(opts?.cwd ? { cwd: opts.cwd } : {}),
      ...(opts?.env ? { env: opts.env } : {}),
      ...(opts?.sudo ? { sudo: true } : {}),
      ...(opts?.timeoutSeconds
        ? { timeoutMs: opts.timeoutSeconds * 1000 }
        : {}),
    });
    const output = await finished.output("both").catch(() => "");
    return { exitCode: finished.exitCode, output };
  }

  async start(_timeoutSeconds: number): Promise<void> {
    // Vercel persistent sandboxes auto-resume on access; nothing to start.
    await this.refresh();
  }
  async stop(): Promise<void> {
    await this.sandbox.stop();
  }
  async archive(): Promise<void> {
    // No separate cold-storage archive on Vercel — stop() auto-snapshots.
    await this.sandbox.stop();
  }
  async delete(): Promise<void> {
    await this.sandbox.delete();
  }
  async refresh(): Promise<void> {
    // Re-fetch the sandbox to pick up current status (resumes if stopped).
    this.sandbox = await Sandbox.get({
      ...this.creds,
      name: this.sandbox.name,
    });
  }

  async previewUrl(port: number): Promise<PreviewUrl> {
    return { url: this.sandbox.domain(port), port };
  }

  async createSnapshot(
    _params: CreateSnapshotParams,
  ): Promise<{ snapshotId: string }> {
    // Vercel snapshots are id-addressed (name is ignored). snapshot() stops the
    // sandbox and returns fast; large state keeps building server-side.
    const snap = await this.sandbox.snapshot({ expiration: 0 });
    return { snapshotId: snap.snapshotId };
  }

  async writeFile(path: string, content: string | Uint8Array): Promise<void> {
    await this.sandbox.writeFiles([{ path, content }]);
  }
}

/** Vercel-backed provider client, scoped to one set of credentials. */
class VercelSandboxClient implements SandboxClient {
  readonly kind: SandboxProviderKind = "vercel";

  constructor(private readonly creds: VercelCredentials) {}

  async create(params: SandboxCreateParams): Promise<SandboxHandle> {
    const base = {
      ...this.creds,
      timeout: params.lifecycle.autoStopMinutes * 60 * 1000,
      persistent: params.lifecycle.ephemeral !== true,
      resources: { vcpus: DEFAULT_VCPUS },
      env: params.envVars,
      ...(params.ports ? { ports: params.ports.slice(0, MAX_PORTS) } : {}),
      ...(params.lifecycle.labels ? { tags: params.lifecycle.labels } : {}),
    };
    const sandbox = params.snapshot
      ? await Sandbox.create({
          ...base,
          source: { type: "snapshot", snapshotId: params.snapshot },
        })
      : await Sandbox.create({ ...base, runtime: "node24" });
    return new VercelSandboxHandle(sandbox, this.creds);
  }

  async get(sandboxId: string): Promise<SandboxHandle> {
    const sandbox = await Sandbox.get({ ...this.creds, name: sandboxId });
    return new VercelSandboxHandle(sandbox, this.creds);
  }

  async getSnapshot(ref: string): Promise<SandboxSnapshotInfo | null> {
    try {
      const { Snapshot } = await import("@vercel/sandbox");
      const snap = await Snapshot.get({ ...this.creds, snapshotId: ref });
      return {
        id: snap.snapshotId,
        status: normalizeSnapshotStatus(String(snap.status)),
        errorReason: null,
        raw: String(snap.status),
      };
    } catch {
      return null;
    }
  }

  async deleteSnapshot(ref: string): Promise<boolean> {
    try {
      const { Snapshot } = await import("@vercel/sandbox");
      const snap = await Snapshot.get({ ...this.creds, snapshotId: ref });
      await snap.delete();
      return true;
    } catch {
      return false;
    }
  }

  async ensureVolume(_name: string): Promise<{ id: string; ready: boolean }> {
    // Persistent named volumes map to Vercel Drives (beta) — not wired yet.
    // Consumers needing CLI-persistence volumes stay on Daytona for now.
    throw new Error(
      "Vercel provider does not implement named volumes yet (Drives, beta — Phase 2 follow-up).",
    );
  }
}

/** Constructs a Vercel-backed {@link SandboxClient} from access-token credentials. */
export function createVercelClient(creds: VercelCredentials): SandboxClient {
  return new VercelSandboxClient(creds);
}
