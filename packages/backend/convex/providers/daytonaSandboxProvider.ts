"use node";

import { Daytona, type Sandbox } from "@daytonaio/sdk";
import type {
  CommandResult,
  CreateSandboxConfig,
  SandboxHandle,
  SandboxProvider,
} from "../sandboxProvider";

const DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS = 120;
const SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS = 300;

class DaytonaSandboxHandle implements SandboxHandle {
  readonly id: string;
  private sandbox: Sandbox;

  constructor(sandbox: Sandbox) {
    this.sandbox = sandbox;
    this.id = sandbox.id;
  }

  async executeCommand(
    cmd: string,
    cwd: string,
    timeout = 30,
  ): Promise<CommandResult> {
    const resp = await this.sandbox.process.executeCommand(
      cmd,
      cwd,
      undefined,
      timeout,
    );
    return { exitCode: resp.exitCode, output: resp.result };
  }

  async uploadFile(content: Buffer, remotePath: string): Promise<void> {
    await this.sandbox.fs.uploadFile(content, remotePath);
  }

  async getPreviewUrl(
    port: number,
    durationSeconds: number,
  ): Promise<{ url: string }> {
    const result = await this.sandbox.getSignedPreviewUrl(
      port,
      durationSeconds,
    );
    return { url: result.url };
  }

  async delete(): Promise<void> {
    await this.sandbox.delete();
  }
}

export class DaytonaSandboxProvider implements SandboxProvider {
  private daytona: Daytona;

  constructor(apiKey: string) {
    this.daytona = new Daytona({ apiKey });
  }

  async create(config: CreateSandboxConfig): Promise<SandboxHandle> {
    const timeoutSeconds = config.template
      ? SNAPSHOT_SANDBOX_READY_TIMEOUT_SECONDS
      : DEFAULT_SANDBOX_READY_TIMEOUT_SECONDS;

    const sandbox = await this.daytona.create(
      {
        ...(config.template
          ? { snapshot: config.template }
          : { language: "typescript" as const }),
        envVars: config.envVars,
        autoStopInterval: config.timeoutMinutes,
        autoDeleteInterval: config.timeoutMinutes + 5,
      },
      { timeout: timeoutSeconds },
    );

    return new DaytonaSandboxHandle(sandbox);
  }

  async get(sandboxId: string): Promise<SandboxHandle> {
    const sandbox = await this.daytona.get(sandboxId);
    return new DaytonaSandboxHandle(sandbox);
  }
}
