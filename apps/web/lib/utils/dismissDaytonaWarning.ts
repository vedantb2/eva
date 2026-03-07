const dismissed = new Set<string>();

export async function dismissDaytonaWarning(url: string): Promise<void> {
  const origin = new URL(url).origin;
  if (dismissed.has(origin)) return;
  try {
    await fetch(url, {
      method: "HEAD",
      headers: { "X-Daytona-Skip-Preview-Warning": "true" },
      credentials: "include",
    });
    dismissed.add(origin);
  } catch {
    // Silently ignore — the warning may still show but won't break functionality
  }
}
