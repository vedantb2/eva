/**
 * Provider-neutral sandbox contract.
 *
 * WHY: eva runs managed codebases in remote sandboxes. The only backend today
 * is Vercel Sandbox (sub-second snapshot restores — Phase 0 spike proved
 * ~0.3s regardless of size). Daytona was the original provider and has been
 * fully removed; this contract stays provider-neutral in shape so a future
 * provider swap does not require touching every `_sandbox_runtime/` consumer again.
 *
 * These types are a hand-written contract, NOT Convex documents — they describe
 * an external SDK surface, so they are defined here rather than imported from
 * generated Convex types.
 *
 * Note: `_sandbox_runtime/` and the `internal.sandbox.*` action namespace keep their
 * names even though Daytona itself is gone — renaming them is tracked as a
 * separate follow-up, not part of the provider removal.
 */

/** Which backend fulfils sandbox operations. Vercel is the only implementation. */
export type SandboxProviderKind = "vercel";

/**
 * Coarse sandbox lifecycle state, normalised across providers.
 *
 * Vercel exposes: running/stopped/stopping/snapshotting/pending/failed/aborted.
 * The adapter maps its native state onto these buckets; `raw` carries the
 * provider's original string for logging and edge-case checks.
 */
export type SandboxState =
  | "running"
  | "stopped"
  | "archived"
  | "restoring"
  | "starting"
  | "error"
  | "gone"
  | "unknown";

/** Result of a one-shot command execution. `output` is combined stdout (stderr on failure paths). */
export interface SandboxExecResult {
  exitCode: number;
  output: string;
}

/** Options for a one-shot command execution. */
export interface SandboxExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  /** Command timeout in seconds (server-enforced). */
  timeoutSeconds?: number;
  /** Run with root privileges. */
  sudo?: boolean;
}

/**
 * Lifecycle policy applied at create time. Neutral, minute-based.
 * Vercel maps `autoStopMinutes` to the session `timeout`, `autoArchiveMinutes`
 * to snapshot expiration, and `ephemeral` to `persistent: false`.
 */
export interface SandboxLifecycleParams {
  autoStopMinutes: number;
  autoArchiveMinutes?: number;
  autoDeleteMinutes?: number;
  ephemeral?: boolean;
  labels?: Record<string, string>;
}

/** Parameters to create a sandbox, optionally seeded from a snapshot. */
export interface SandboxCreateParams {
  /** Vercel snapshotId. Omit for a bare sandbox. */
  snapshot?: string;
  envVars: Record<string, string>;
  lifecycle: SandboxLifecycleParams;
  /** Ports to expose publicly (Vercel needs these declared up front). */
  ports?: number[];
  /** Override the create-ready wait; large seeded snapshots need longer. */
  readyTimeoutSeconds?: number;
}

/** Narrowed view of a snapshot record. */
export interface SandboxSnapshotInfo {
  id: string;
  /** Normalised: "ready" (usable), "pending" (still building), "error" (rebuild needed). */
  status: "ready" | "pending" | "error";
  errorReason: string | null;
  raw: string;
}

/** Parameters to capture a snapshot from a running sandbox. */
export interface CreateSnapshotParams {
  /**
   * Desired snapshot name. Vercel is id-addressed and ignores this for
   * addressing, so it is used only for logging and error messages. Callers must
   * use the returned `snapshotId`, never this name, to poll or persist.
   */
  name?: string;
}

/** A signed/public preview URL for a port inside the sandbox. */
export interface PreviewUrl {
  url: string;
  port: number;
}

// ---------------------------------------------------------------------------
// Optional capability sub-interfaces (wired last; a provider may omit them
// until implemented, hence optional on SandboxHandle).
// ---------------------------------------------------------------------------

/** In-sandbox git operations, backed by shell git. */
export interface SandboxGit {
  branches(workspaceDir: string): Promise<{ branches: string[] }>;
  clone(
    url: string,
    dest: string,
    authUser: string,
    authToken: string,
  ): Promise<void>;
  checkoutBranch(workspaceDir: string, branchName: string): Promise<void>;
}

/** Desktop / ComputerUse capability (Xvfb + browser for vision tasks). */
export interface SandboxDesktop {
  start(): Promise<void>;
  stop(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Core interfaces
// ---------------------------------------------------------------------------

/**
 * A handle to a single running (or resumable) sandbox. Wraps the provider's
 * per-instance SDK object. Property getters expose identity and normalised
 * state; methods cover the lifecycle and I/O eva actually uses.
 */
export interface SandboxHandle {
  readonly id: string;
  /** Allocated vCPUs, if the provider reports it. */
  readonly cpu?: number;
  /** Allocated memory in MB, if reported. */
  readonly memory?: number;
  /** Allocated disk in GB, if reported. */
  readonly disk?: number;

  /** Last-known normalised state. Call {@link refresh} to update. */
  readonly state: SandboxState;
  readonly errorReason: string | null;

  exec(cmd: string, opts?: SandboxExecOptions): Promise<SandboxExecResult>;

  /**
   * Launch a command detached and return immediately, without holding the exec
   * stream for the process's lifetime. Used to kick off long-running daemons /
   * the seed-run script. Must use native detached exec — a shell `&` inside a
   * synchronous exec keeps Vercel's stream open until it times out.
   */
  execDetached(cmd: string, opts?: SandboxExecOptions): Promise<void>;

  /**
   * Write a file into the sandbox filesystem at an absolute path, creating
   * parent directories as needed (Vercel: `writeFiles`).
   */
  writeFile(path: string, content: string | Uint8Array): Promise<void>;

  /**
   * Start/resume the sandbox, waiting up to `timeoutSeconds` for readiness.
   *
   * `resumeAfterStop` encodes caller intent when a stop is still in flight
   * (`stopping`/`snapshotting` while the snapshot is written). Explicit
   * user-initiated starts pass true: wait the stop out, then resume from the
   * fresh snapshot. Background callers (prewarm, watchdog, lazy resume) omit
   * it: the start is refused so a stale in-flight resume cannot resurrect a
   * sandbox the user just stopped.
   */
  start(
    timeoutSeconds: number,
    opts?: { resumeAfterStop?: boolean },
  ): Promise<void>;
  stop(): Promise<void>;
  archive(): Promise<void>;
  /**
   * Permanently remove the sandbox. On Vercel, also deletes snap_* objects for
   * this sandbox name (SDK delete does not reliably cascade). Pass
   * `preserveSnapshotIds` when a seed capture must survive prep-sandbox teardown.
   */
  delete(options?: {
    preserveSnapshotIds?: ReadonlyArray<string>;
  }): Promise<void>;
  /** Re-read live state/errorReason from the provider. */
  refresh(): Promise<void>;

  /** Public/signed URL for a port. */
  previewUrl(port: number, ttlSeconds?: number): Promise<PreviewUrl>;

  /**
   * Register a filesystem snapshot of this sandbox and return its id.
   *
   * Returns as soon as the snapshot is registered, NOT when the capture
   * finishes — a seeded snapshot carrying a whole DB volume keeps building
   * server-side for minutes. Poll {@link SandboxClient.getSnapshot} with the
   * returned id for readiness. Callers that need completion must do so across
   * separate steps; awaiting the capture inline would exceed Convex's ~600s
   * per-action ceiling.
   *
   * Note the sandbox is stopped as part of capture.
   */
  createSnapshot(params: CreateSnapshotParams): Promise<{ snapshotId: string }>;

  readonly git: SandboxGit;

  /**
   * Present only on providers that support it. Vercel's interactive PTY is
   * wired one layer up in `../pty.ts` / `../_pty/vercel.ts` rather than
   * through this interface, so this stays undefined by design.
   */
  readonly desktop?: SandboxDesktop;
}

/**
 * A provider client scoped to one set of credentials. Owns sandbox creation,
 * lookup, and account-level snapshot operations.
 */
export interface SandboxClient {
  readonly kind: SandboxProviderKind;

  create(params: SandboxCreateParams): Promise<SandboxHandle>;
  get(sandboxId: string): Promise<SandboxHandle>;

  getSnapshot(ref: string): Promise<SandboxSnapshotInfo | null>;
  deleteSnapshot(ref: string): Promise<boolean>;
}

/** Credentials for the active provider. */
export type SandboxCredentials = {
  kind: "vercel";
  token: string;
  teamId: string;
  projectId: string;
};
