"use node";

/**
 * Daytona implementation of the provider-neutral sandbox contract
 * (see ./provider.ts). This is a THIN adapter: it wraps the `@daytonaio/sdk`
 * `Daytona` client and `Sandbox` objects and maps their calls onto the neutral
 * interface. Higher-level orchestration (git choreography, Docker daemon,
 * seeding) stays in `../_daytona/` and drives the sandbox through this handle —
 * it is not duplicated here.
 *
 * Keeping it thin is deliberate: the adapter should be obvious to read against
 * the SDK, and the only behaviour it owns is the state normalisation and
 * argument reshaping needed to satisfy the contract.
 */

import { Daytona } from "@daytonaio/sdk";
import type {
  CreateSandboxFromSnapshotParams,
  Sandbox as DaytonaSandbox,
  VolumeMount,
} from "@daytonaio/sdk";
import type {
  CreateSnapshotParams,
  PreviewUrl,
  SandboxClient,
  SandboxCreateParams,
  SandboxDesktop,
  SandboxExecOptions,
  SandboxExecResult,
  SandboxGit,
  SandboxHandle,
  SandboxProviderKind,
  SandboxPty,
  SandboxPtyHandle,
  SandboxSnapshotInfo,
  SandboxState,
} from "./provider";

/** Maps Daytona's native sandbox state string onto the neutral {@link SandboxState}. */
function normalizeState(raw: string | undefined): SandboxState {
  switch (raw) {
    case "started":
      return "running";
    case "stopped":
    case "stopping":
      return "stopped";
    case "archived":
    case "archiving":
      return "archived";
    case "restoring":
      return "restoring";
    case "starting":
    case "creating":
      return "starting";
    case "error":
    case "build_failed":
      return "error";
    case "destroyed":
      return "gone";
    default:
      return "unknown";
  }
}

/** Maps a Daytona snapshot state string onto the neutral snapshot status. */
function normalizeSnapshotStatus(raw: string): SandboxSnapshotInfo["status"] {
  if (raw === "active" || raw === "ready") return "ready";
  if (raw === "error" || raw === "build_failed") return "error";
  return "pending";
}

/** Daytona git operations, delegating to the SDK's native git client. */
class DaytonaGit implements SandboxGit {
  constructor(private readonly sandbox: DaytonaSandbox) {}

  async branches(workspaceDir: string): Promise<{ branches: string[] }> {
    const result = await this.sandbox.git.branches(workspaceDir);
    return { branches: result.branches };
  }

  async clone(
    url: string,
    dest: string,
    authUser: string,
    authToken: string,
  ): Promise<void> {
    // Daytona: clone(url, path, branch?, commitId?, username?, password?).
    await this.sandbox.git.clone(
      url,
      dest,
      undefined,
      undefined,
      authUser,
      authToken,
    );
  }

  async checkoutBranch(
    workspaceDir: string,
    branchName: string,
  ): Promise<void> {
    await this.sandbox.git.checkoutBranch(workspaceDir, branchName);
  }
}

/** Daytona PTY operations, delegating to the SDK process API. */
class DaytonaPty implements SandboxPty {
  constructor(private readonly sandbox: DaytonaSandbox) {}

  async open(opts: {
    id: string;
    cols: number;
    rows: number;
    cwd: string;
    env?: Record<string, string>;
    onData: (chunk: Uint8Array) => void;
  }): Promise<SandboxPtyHandle> {
    const handle = await this.sandbox.process.createPty({
      id: opts.id,
      cols: opts.cols,
      rows: opts.rows,
      cwd: opts.cwd,
      envs: opts.env,
      onData: opts.onData,
    });
    return { disconnect: () => handle.disconnect() };
  }

  async resize(ptyId: string, cols: number, rows: number): Promise<void> {
    await this.sandbox.process.resizePtySession(ptyId, cols, rows);
  }

  async kill(ptyId: string): Promise<void> {
    await this.sandbox.process.killPtySession(ptyId);
  }
}

/** Daytona desktop (ComputerUse) operations. */
class DaytonaDesktop implements SandboxDesktop {
  constructor(private readonly sandbox: DaytonaSandbox) {}

  async start(): Promise<void> {
    await this.sandbox.computerUse.start();
  }

  async stop(): Promise<void> {
    await this.sandbox.computerUse.stop();
  }
}

/** A handle to one Daytona sandbox, exposing the neutral {@link SandboxHandle}. */
class DaytonaSandboxHandle implements SandboxHandle {
  readonly git: SandboxGit;
  readonly pty: SandboxPty;
  readonly desktop: SandboxDesktop;

  constructor(private readonly sandbox: DaytonaSandbox) {
    this.git = new DaytonaGit(sandbox);
    this.pty = new DaytonaPty(sandbox);
    this.desktop = new DaytonaDesktop(sandbox);
  }

  /**
   * Migration escape hatch: recover the underlying Daytona sandbox. Not on the
   * neutral {@link SandboxHandle} interface, so it is only reachable after an
   * `instanceof` narrowing (see {@link unwrapDaytonaSandbox}). Deleted once every
   * `_daytona` consumer is converted onto SandboxHandle.
   */
  unwrap(): DaytonaSandbox {
    return this.sandbox;
  }

  get id(): string {
    return this.sandbox.id;
  }
  get cpu(): number {
    return this.sandbox.cpu;
  }
  get memory(): number {
    return this.sandbox.memory;
  }
  get disk(): number {
    return this.sandbox.disk;
  }
  get state(): SandboxState {
    return normalizeState(this.sandbox.state);
  }
  get errorReason(): string | null {
    return this.sandbox.errorReason ?? null;
  }

  async exec(
    cmd: string,
    opts?: SandboxExecOptions,
  ): Promise<SandboxExecResult> {
    // Daytona has no `sudo` flag — callers that need root prefix `sudo` in the
    // command string, so `opts.sudo` is intentionally not forwarded here.
    const resp = await this.sandbox.process.executeCommand(
      cmd,
      opts?.cwd,
      opts?.env,
      opts?.timeoutSeconds,
    );
    return { exitCode: resp.exitCode, output: resp.result };
  }

  async start(timeoutSeconds: number): Promise<void> {
    await this.sandbox.start(timeoutSeconds);
  }
  async stop(): Promise<void> {
    await this.sandbox.stop();
  }
  async archive(): Promise<void> {
    await this.sandbox.archive();
  }
  async delete(): Promise<void> {
    await this.sandbox.delete();
  }
  async refresh(): Promise<void> {
    await this.sandbox.refreshData();
  }

  async previewUrl(port: number, ttlSeconds?: number): Promise<PreviewUrl> {
    const signed = await this.sandbox.getSignedPreviewUrl(port, ttlSeconds);
    return { url: signed.url, port };
  }

  async createSnapshot(
    params: CreateSnapshotParams,
  ): Promise<{ snapshotId: string }> {
    if (!params.name) {
      throw new Error(
        "Daytona snapshots require a name; pass CreateSnapshotParams.name.",
      );
    }
    await this.sandbox._experimental_createSnapshot(
      params.name,
      params.timeoutSeconds,
    );
    // Daytona identifies snapshots by name, so the name IS the id.
    return { snapshotId: params.name };
  }
}

/** Daytona-backed provider client, scoped to one API key. */
class DaytonaSandboxClient implements SandboxClient {
  readonly kind: SandboxProviderKind = "daytona";

  constructor(private readonly daytona: Daytona) {}

  async create(params: SandboxCreateParams): Promise<SandboxHandle> {
    const volumes: VolumeMount[] | undefined = params.volumes?.map((v) => ({
      volumeId: v.volumeId,
      mountPath: v.mountPath,
      ...(v.subpath ? { subpath: v.subpath } : {}),
    }));
    const createParams: CreateSandboxFromSnapshotParams = {
      envVars: params.envVars,
      autoStopInterval: params.lifecycle.autoStopMinutes,
      ...(params.lifecycle.autoArchiveMinutes !== undefined
        ? { autoArchiveInterval: params.lifecycle.autoArchiveMinutes }
        : {}),
      ...(params.lifecycle.autoDeleteMinutes !== undefined
        ? { autoDeleteInterval: params.lifecycle.autoDeleteMinutes }
        : {}),
      ...(params.lifecycle.ephemeral ? { ephemeral: true } : {}),
      ...(params.lifecycle.labels ? { labels: params.lifecycle.labels } : {}),
      ...(volumes ? { volumes } : {}),
      ...(params.snapshot ? { snapshot: params.snapshot } : {}),
    };
    const sandbox = await this.daytona.create(createParams, {
      timeout: params.readyTimeoutSeconds ?? 60,
    });
    return new DaytonaSandboxHandle(sandbox);
  }

  async get(sandboxId: string): Promise<SandboxHandle> {
    const sandbox = await this.daytona.get(sandboxId);
    return new DaytonaSandboxHandle(sandbox);
  }

  async getSnapshot(ref: string): Promise<SandboxSnapshotInfo | null> {
    try {
      const snapshot = await this.daytona.snapshot.get(ref);
      return {
        id: String(snapshot.id),
        status: normalizeSnapshotStatus(String(snapshot.state)),
        errorReason:
          snapshot.errorReason != null ? String(snapshot.errorReason) : null,
        raw: String(snapshot.state),
      };
    } catch {
      return null;
    }
  }

  async deleteSnapshot(ref: string): Promise<boolean> {
    try {
      const snapshot = await this.daytona.snapshot.get(ref);
      await this.daytona.snapshot.delete(snapshot);
      return true;
    } catch {
      return false;
    }
  }

  async ensureVolume(name: string): Promise<{ id: string; ready: boolean }> {
    const volume = await this.daytona.volume.get(name, true);
    return { id: volume.id, ready: String(volume.state) === "ready" };
  }
}

/** Constructs a Daytona-backed {@link SandboxClient} from an API key. */
export function createDaytonaClient(apiKey: string): SandboxClient {
  return new DaytonaSandboxClient(new Daytona({ apiKey }));
}

/**
 * Wraps a raw Daytona sandbox in a {@link SandboxHandle}. Migration helper for
 * call sites that still receive a Daytona `Sandbox` (e.g. from a not-yet-
 * converted function) and need to hand it to converted code.
 */
export function wrapDaytonaSandbox(sandbox: DaytonaSandbox): SandboxHandle {
  return new DaytonaSandboxHandle(sandbox);
}

/**
 * Recovers the underlying Daytona sandbox from a handle, for converted code
 * that must still call a not-yet-converted function taking a raw `Sandbox`.
 * Throws if the handle is not Daytona-backed. Both this and
 * {@link wrapDaytonaSandbox} are deleted at the end of the Phase 1 rewire.
 */
export function unwrapDaytonaSandbox(handle: SandboxHandle): DaytonaSandbox {
  if (handle instanceof DaytonaSandboxHandle) {
    return handle.unwrap();
  }
  throw new Error("Expected a Daytona-backed sandbox handle.");
}
