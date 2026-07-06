/**
 * Provider-neutral sandbox contract.
 *
 * WHY: eva runs managed codebases in remote sandboxes. Today that is Daytona
 * (see `../_daytona/`). We are migrating to Vercel Sandbox for sub-second
 * snapshot restores (Phase 0 spike proved ~0.3s regardless of size). To migrate
 * without a big-bang rewrite, every sandbox operation eva uses is expressed here
 * as a provider-neutral interface. A Daytona adapter (default) and a Vercel
 * adapter both implement it, selected per-repo/team by the `SANDBOX_PROVIDER`
 * flag (see `../envVarResolver.ts`).
 *
 * These types are a hand-written contract, NOT Convex documents — they describe
 * an external SDK surface, so they are defined here rather than imported from
 * generated Convex types.
 *
 * Scope note: this file defines the CONTRACT. Consumers in `../_daytona/` are
 * rewired onto it, and the Daytona/Vercel adapters implement it, in follow-up
 * commits. Terminal (PTY) and desktop (ComputerUse) are optional capabilities
 * because they differ most between providers and are wired last.
 */

/** Which backend fulfils sandbox operations. Resolved per repo/team; defaults to daytona. */
export type SandboxProviderKind = "daytona" | "vercel";

/**
 * Coarse sandbox lifecycle state, normalised across providers.
 *
 * Daytona exposes: started/stopped/archived/restoring/building/error/… .
 * Vercel exposes: running/stopped/stopping/snapshotting/pending/failed/aborted.
 * Adapters map their native state onto these buckets; `raw` carries the
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

/** A volume/drive mount request. Daytona: named volumes; Vercel: Drives (beta). */
export interface VolumeMountSpec {
  volumeId: string;
  mountPath: string;
  subpath?: string;
}

/**
 * Lifecycle policy applied at create time. Neutral, minute-based.
 * Daytona maps these to autoStop/autoArchive/autoDelete intervals + ephemeral.
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
  /** Provider-specific snapshot identifier (Daytona snapshot name / Vercel snapshotId). Omit for a bare sandbox. */
  snapshot?: string;
  envVars: Record<string, string>;
  lifecycle: SandboxLifecycleParams;
  volumes?: VolumeMountSpec[];
  /** Ports to expose publicly (Vercel needs these declared up front; Daytona ignores). */
  ports?: number[];
  /** Override the create-ready wait; large seeded snapshots need longer on Daytona. */
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
  /** Desired snapshot name. Daytona requires it; Vercel ignores it and returns a generated id. */
  name?: string;
  timeoutSeconds?: number;
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

/** In-sandbox git operations. Daytona has a native `git` client; Vercel runs shell git. */
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

/** A live pseudo-terminal session bound to the sandbox. */
export interface SandboxPtyHandle {
  disconnect(): Promise<void>;
}

/** Pseudo-terminal capability (browser terminal). */
export interface SandboxPty {
  open(opts: {
    id: string;
    cols: number;
    rows: number;
    cwd: string;
    env?: Record<string, string>;
    onData: (chunk: Uint8Array) => void;
  }): Promise<SandboxPtyHandle>;
  resize(ptyId: string, cols: number, rows: number): Promise<void>;
  kill(ptyId: string): Promise<void>;
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

  /** Start/resume the sandbox, waiting up to `timeoutSeconds` for readiness. */
  start(timeoutSeconds: number): Promise<void>;
  stop(): Promise<void>;
  archive(): Promise<void>;
  delete(): Promise<void>;
  /** Re-read live state/errorReason from the provider. */
  refresh(): Promise<void>;

  /** Public/signed URL for a port. */
  previewUrl(port: number, ttlSeconds?: number): Promise<PreviewUrl>;

  /**
   * Initiate a filesystem snapshot of this sandbox and return the new snapshot
   * id. May return before the capture finishes (large seeded snapshots keep
   * building server-side); poll {@link SandboxClient.getSnapshot} for readiness.
   */
  createSnapshot(params: CreateSnapshotParams): Promise<{ snapshotId: string }>;

  readonly git: SandboxGit;

  /** Present only on providers that support it (wired last). */
  readonly pty?: SandboxPty;
  readonly desktop?: SandboxDesktop;
}

/**
 * A provider client scoped to one set of credentials. Owns sandbox creation,
 * lookup, and account-level snapshot/volume operations.
 */
export interface SandboxClient {
  readonly kind: SandboxProviderKind;

  create(params: SandboxCreateParams): Promise<SandboxHandle>;
  get(sandboxId: string): Promise<SandboxHandle>;

  getSnapshot(ref: string): Promise<SandboxSnapshotInfo | null>;
  deleteSnapshot(ref: string): Promise<boolean>;

  /** Provision (or look up) a named persistent volume/drive. */
  ensureVolume(name: string): Promise<{ id: string; ready: boolean }>;
}

/** Credentials for whichever provider is active. Exactly one branch is populated. */
export type SandboxCredentials =
  | { kind: "daytona"; apiKey: string }
  | { kind: "vercel"; token: string; teamId: string; projectId: string };
