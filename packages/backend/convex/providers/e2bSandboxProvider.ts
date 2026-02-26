"use node";

import { CommandExitError, Sandbox } from "e2b";
import type {
  CommandResult,
  CreateSandboxConfig,
  SandboxHandle,
  SandboxProvider,
} from "../sandboxProvider";

const DEFAULT_TIMEOUT_MS = 120_000;
const TEMPLATE_TIMEOUT_MS = 300_000;

class E2BSandboxHandle implements SandboxHandle {
  readonly id: string;
  private sandbox: Sandbox;

  constructor(sandbox: Sandbox) {
    this.sandbox = sandbox;
    this.id = sandbox.sandboxId;
  }

  async executeCommand(
    cmd: string,
    cwd: string,
    timeout = 30,
  ): Promise<CommandResult> {
    try {
      const result = await this.sandbox.commands.run(cmd, {
        cwd,
        timeoutMs: timeout * 1000,
      });
      return {
        exitCode: result.exitCode,
        output: result.stdout + result.stderr,
      };
    } catch (error) {
      if (error instanceof CommandExitError) {
        return {
          exitCode: error.exitCode,
          output: error.stdout + error.stderr,
        };
      }
      throw error;
    }
  }

  async uploadFile(content: Buffer, remotePath: string): Promise<void> {
    await this.sandbox.files.write(remotePath, content.toString("utf-8"));
  }

  async getPreviewUrl(
    port: number,
    _durationSeconds: number,
  ): Promise<{ url: string }> {
    const host = this.sandbox.getHost(port);
    return { url: `https://${host}` };
  }

  async delete(): Promise<void> {
    await this.sandbox.kill();
  }
}

export class E2BSandboxProvider implements SandboxProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async create(config: CreateSandboxConfig): Promise<SandboxHandle> {
    const timeoutMs = config.template
      ? TEMPLATE_TIMEOUT_MS
      : DEFAULT_TIMEOUT_MS;

    const sandbox = config.template
      ? await Sandbox.create(config.template, {
          apiKey: this.apiKey,
          envs: config.envVars,
          timeoutMs: config.timeoutMinutes * 60 * 1000,
          requestTimeoutMs: timeoutMs,
        })
      : await Sandbox.create({
          apiKey: this.apiKey,
          envs: config.envVars,
          timeoutMs: config.timeoutMinutes * 60 * 1000,
          requestTimeoutMs: timeoutMs,
        });

    return new E2BSandboxHandle(sandbox);
  }

  async get(sandboxId: string): Promise<SandboxHandle> {
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: this.apiKey,
    });
    return new E2BSandboxHandle(sandbox);
  }
}
