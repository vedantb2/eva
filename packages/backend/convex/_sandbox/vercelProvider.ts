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
  SandboxDesktop,
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

const DEFAULT_VCPUS = Number(process.env.SANDBOX_VERCEL_VCPUS ?? "8");
// Vercel caps the create-time `env` payload at 4 KB, but eva injects the full
// repo/team env (~6 KB+). Instead of passing env at create, we write it to this
// file in the sandbox and source it on every exec — no size cap, and it persists
// across get()/resume like any other file.
const EVA_ENV_FILE = "/vercel/sandbox/.eva-env.sh";

/** Renders env vars as sourceable `export K='V'` lines (single-quote-escaped). */
function renderEnvFile(env: Record<string, string>): string {
  return (
    Object.entries(env)
      .map(([k, v]) => `export ${k}='${v.replace(/'/g, "'\\''")}'`)
      .join("\n") + "\n"
  );
}

/** Prefix that sources the eva env file (if present) before a command. */
const SOURCE_ENV = `[ -f ${EVA_ENV_FILE} ] && . ${EVA_ENV_FILE};`;
/** Vercel exposes at most 4 ports; default to the eva dev + proxy range if unset. */
const MAX_PORTS = 4;
export const VERCEL_DEFAULT_EXPOSED_PORTS: ReadonlyArray<number> = [
  3000, 8080, 6080, 54321,
];

/** Maps Vercel's session status onto the neutral {@link SandboxState}. */
function normalizeState(raw: string | undefined): SandboxState {
  switch (raw) {
    case "running":
      return "running";
    case "stopped":
    case "stopping":
    case "snapshotting":
      return "stopped";
    case "starting":
    case "pending":
      return "starting";
    case "failed":
    case "error":
      return "error";
    case "aborted":
    case "destroying":
    case "destroyed":
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

/**
 * Extracts a human-readable detail string from a Vercel SDK APIError (or any
 * thrown value). The SDK's `APIError` carries `.json` and `.text` fields with
 * the actual API response body — these are far more useful than the generic
 * "Status code 4xx is not ok" message that otherwise appears in logs.
 *
 * `JSON.stringify(e, Object.getOwnPropertyNames(e))` serialises ALL own
 * properties (including non-enumerable ones like `json`, `text`, `message`)
 * without any type assertions.
 */
function extractApiErrorDetail(e: unknown): string {
  if (e === null || typeof e !== "object") return String(e);
  try {
    return JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, 1000);
  } catch (_err) {
    return e instanceof Error ? e.message : String(e);
  }
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

/** Vercel desktop operations, implemented with the same in-sandbox noVNC stack. */
class VercelDesktop implements SandboxDesktop {
  constructor(private readonly handle: VercelSandboxHandle) {}

  async start(): Promise<void> {
    const install = [
      "command -v Xvnc >/dev/null 2>&1",
      "command -v websockify >/dev/null 2>&1",
      "test -d /opt/noVNC",
    ].join(" && ");
    await this.handle.exec(
      [
        `if ! ( ${install} ); then`,
        "  sudo dnf install -y tigervnc-server python3 python3-pip xorg-x11-utils xterm dbus-x11 procps-ng psmisc git >/tmp/desktop-dnf.log 2>&1",
        "  sudo dnf install -y gtk3 nss alsa-lib libXtst at-spi2-core libdrm mesa-libgbm libxkbcommon libXdamage libXcomposite libXrandr libXcursor libXinerama cups-libs >/tmp/desktop-gui-dnf.log 2>&1 || true",
        "  python3 -m pip install --user --break-system-packages websockify >/tmp/websockify-pip.log 2>&1 || python3 -m pip install --user websockify >/tmp/websockify-pip.log 2>&1",
        "  sudo ln -sf $(python3 -m site --user-base)/bin/websockify /usr/local/bin/websockify || true",
        "  sudo rm -rf /opt/noVNC && sudo git clone --depth 1 https://github.com/novnc/noVNC.git /opt/noVNC >/tmp/novnc-git.log 2>&1",
        "fi",
        "if ! command -v google-chrome-stable >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1; then",
        "  sudo tee /etc/yum.repos.d/google-chrome.repo >/dev/null <<'EOF'",
        "[google-chrome]",
        "name=google-chrome",
        "baseurl=https://dl.google.com/linux/chrome/rpm/stable/x86_64",
        "enabled=1",
        "gpgcheck=1",
        "gpgkey=https://dl.google.com/linux/linux_signing_key.pub",
        "EOF",
        "  sudo dnf install -y google-chrome-stable >/tmp/chrome-dnf.log 2>&1 || sudo dnf install -y chromium >/tmp/chromium-dnf.log 2>&1 || true",
        "fi",
        "mkdir -p /home/eva/.vnc /tmp",
        "sudo mkdir -p /tmp/.X11-unix && sudo chmod 1777 /tmp/.X11-unix",
        "pkill -x x0vncserver 2>/dev/null || true",
        "fuser -k 6080/tcp 2>/dev/null || true",
        "export DISPLAY=:1",
        "if ! pgrep -x Xvnc >/dev/null; then setsid Xvnc :1 -geometry ${VNC_RESOLUTION:-1920x1080} -depth 24 -SecurityTypes None -AlwaysShared=1 >/tmp/xvnc.log 2>&1 & fi",
        "for i in $(seq 1 30); do xprop -display :1 -root >/dev/null 2>&1 && break; sleep 1; done",
        "setsid websockify --web=/opt/noVNC 0.0.0.0:6080 127.0.0.1:5901 >/tmp/novnc.log 2>&1 &",
        "for i in $(seq 1 30); do curl -fsS http://127.0.0.1:6080/vnc_lite.html >/dev/null 2>&1 && break; sleep 1; done",
        "curl -fsS http://127.0.0.1:6080/vnc_lite.html >/dev/null",
      ].join("\n"),
      { timeoutSeconds: 240 },
    );
  }

  async stop(): Promise<void> {
    await this.handle.exec(
      "fuser -k 6080/tcp 2>/dev/null || true; pkill -x Xvnc 2>/dev/null || true; pkill -x x0vncserver 2>/dev/null || true; pkill -f '[X]vfb :0' 2>/dev/null || true",
      { timeoutSeconds: 30 },
    );
  }
}

/** A handle to one Vercel sandbox, exposing the neutral {@link SandboxHandle}. */
class VercelSandboxHandle implements SandboxHandle {
  readonly desktop: SandboxDesktop;

  constructor(
    private sandbox: Sandbox,
    private readonly creds: VercelCredentials,
  ) {
    this.desktop = new VercelDesktop(this);
  }

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
    try {
      const finished = await this.sandbox.runCommand({
        cmd: "bash",
        args: ["-lc", `${SOURCE_ENV} ${cmd}`],
        ...(opts?.cwd ? { cwd: opts.cwd } : {}),
        ...(opts?.env ? { env: opts.env } : {}),
        ...(opts?.sudo ? { sudo: true } : {}),
        ...(opts?.timeoutSeconds
          ? { timeoutMs: opts.timeoutSeconds * 1000 }
          : {}),
      });
      const output = await finished.output("both").catch(() => "");
      return { exitCode: finished.exitCode, output };
    } catch (e) {
      // The Vercel SDK throws APIError whose .json / .text fields carry the
      // actual API response body — surface them so 400/422 failures are
      // diagnosable in Convex logs instead of just "Status code 4xx is not ok".
      const detail = extractApiErrorDetail(e);
      throw new Error(
        `vercel exec failed (cwd=${opts?.cwd ?? "(default)"}, cmd=${cmd.slice(0, 120)}): ${detail}`,
      );
    }
  }

  async execDetached(cmd: string, opts?: SandboxExecOptions): Promise<void> {
    // Native detached exec: returns a Command handle immediately without holding
    // the stream. This is the analogue of eva's `setsid nohup … &` on Daytona —
    // a shell `&` inside a synchronous runCommand would keep the stream open
    // until it times out (StreamError). The command itself still backgrounds its
    // long-runner with setsid so it survives this launcher process exiting.
    await this.sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", `${SOURCE_ENV} ${cmd}`],
      ...(opts?.cwd ? { cwd: opts.cwd } : {}),
      ...(opts?.env ? { env: opts.env } : {}),
      ...(opts?.sudo ? { sudo: true } : {}),
      detached: true,
    });
  }

  async start(timeoutSeconds: number): Promise<void> {
    // Vercel persistent sandboxes resume when a command is run. A plain get()
    // only returns the saved sandbox record, so kick it with a tiny command.
    await this.refresh();
    if (this.state !== "running") {
      await this.exec("true", { timeoutSeconds });
      await this.refresh();
    }
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
    if (VERCEL_DEFAULT_EXPOSED_PORTS.includes(port)) {
      await this.sandbox.update({ ports: [...VERCEL_DEFAULT_EXPOSED_PORTS] });
      await this.refresh();
    }
    try {
      return { url: this.sandbox.domain(port), port };
    } catch (error) {
      if (!VERCEL_DEFAULT_EXPOSED_PORTS.includes(port)) {
        throw error;
      }
      await this.sandbox.update({ ports: [...VERCEL_DEFAULT_EXPOSED_PORTS] });
      await this.refresh();
      return { url: this.sandbox.domain(port), port };
    }
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
    // env is written to a file post-create (see EVA_ENV_FILE) rather than passed
    // here — Vercel's create-time env cap is 4 KB and eva's env exceeds it.
    const base = {
      ...this.creds,
      // Vercel `timeout` is a HARD session cap, not Daytona's idle-stop timer.
      // Mapping a small autoStop (e.g. WARMING's 10 min) straight through would
      // hard-kill a ~11-min seed build mid-run. Floor it to 45 min so builds and
      // resumes have headroom; eva stops sandboxes explicitly (snapshot/stop),
      // and Vercel bills only active CPU + provisioned memory while running.
      timeout: Math.max(params.lifecycle.autoStopMinutes, 45) * 60 * 1000,
      persistent: params.lifecycle.ephemeral !== true,
      resources: { vcpus: DEFAULT_VCPUS },
      ports: (params.ports ?? VERCEL_DEFAULT_EXPOSED_PORTS).slice(0, MAX_PORTS),
      ...(params.lifecycle.labels ? { tags: params.lifecycle.labels } : {}),
    };
    try {
      const sandbox = params.snapshot
        ? await Sandbox.create({
            ...base,
            source: { type: "snapshot", snapshotId: params.snapshot },
          })
        : await Sandbox.create({ ...base, runtime: "node24" });
      if (params.envVars && Object.keys(params.envVars).length > 0) {
        await sandbox.writeFiles([
          { path: EVA_ENV_FILE, content: renderEnvFile(params.envVars) },
        ]);
      }
      // Fresh node24 sandboxes don't include /tmp/repo. Every execHandle call
      // defaults to that cwd (WORKSPACE_DIR = "/tmp/repo" in helpers.ts), so
      // any command with no explicit cwd returns HTTP 400 until the directory
      // exists. Pre-create it here so git config / ensureDockerDaemon calls in
      // createSandbox succeed. Snapshot-restored sandboxes already have the
      // directory baked in, so this is only needed for fresh ones.
      if (!params.snapshot) {
        await sandbox.mkDir("/tmp/repo");
      }
      return new VercelSandboxHandle(sandbox, this.creds);
    } catch (e) {
      // The SDK's message is just the HTTP status; surface the API body + the
      // params we sent (env values redacted) so a create failure is diagnosable.
      const detail = extractApiErrorDetail(e);
      throw new Error(
        `vercel create failed (snapshot=${params.snapshot ?? "none"}, timeout=${base.timeout}, persistent=${base.persistent}, vcpus=${DEFAULT_VCPUS}, envKeys=[${Object.keys(params.envVars ?? {}).join(",")}], hasTags=${Boolean(params.lifecycle.labels)}): ${detail}`,
      );
    }
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

/** Recovers the underlying Vercel sandbox from a handle (PTY, etc.). */
export function unwrapVercelSandbox(handle: SandboxHandle): Sandbox {
  if (handle instanceof VercelSandboxHandle) {
    return handle.unwrap();
  }
  throw new Error("Expected a Vercel-backed sandbox handle.");
}

/** Constructs a Vercel-backed {@link SandboxClient} from access-token credentials. */
export function createVercelClient(creds: VercelCredentials): SandboxClient {
  return new VercelSandboxClient(creds);
}
