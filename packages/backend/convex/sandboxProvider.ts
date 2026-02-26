"use node";

import { DaytonaSandboxProvider } from "./providers/daytonaSandboxProvider";
import { E2BSandboxProvider } from "./providers/e2bSandboxProvider";

export type SandboxProviderType = "e2b" | "daytona";

export interface CommandResult {
  exitCode: number;
  output: string;
}

export interface SandboxHandle {
  readonly id: string;
  executeCommand(
    cmd: string,
    cwd: string,
    timeout?: number,
  ): Promise<CommandResult>;
  uploadFile(content: Buffer, remotePath: string): Promise<void>;
  getPreviewUrl(
    port: number,
    durationSeconds: number,
  ): Promise<{ url: string }>;
  delete(): Promise<void>;
}

export interface CreateSandboxConfig {
  template?: string;
  envVars: Record<string, string>;
  timeoutMinutes: number;
}

export interface SandboxProvider {
  create(config: CreateSandboxConfig): Promise<SandboxHandle>;
  get(sandboxId: string): Promise<SandboxHandle>;
}

export function createSandboxProvider(
  providerType: SandboxProviderType,
  apiKey: string,
): SandboxProvider {
  switch (providerType) {
    case "e2b":
      return new E2BSandboxProvider(apiKey);
    case "daytona":
      return new DaytonaSandboxProvider(apiKey);
  }
}
