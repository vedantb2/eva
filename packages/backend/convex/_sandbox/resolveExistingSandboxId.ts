/** Returns the persisted sandbox id for reuse. */
export function preferPersistedSandboxId(args: {
  sandboxId: string | undefined;
}): string | undefined {
  return args.sandboxId;
}

/** Resolves the reusable sandbox id from a persisted entity for start/resume. */
export function resolveReusableVercelSandboxId(args: {
  sandboxId?: string;
}): string | undefined {
  return args.sandboxId;
}
