const dismissed = new Set<string>();

export async function dismissDaytonaWarning(url: string): Promise<void> {
  const origin = new URL(url).origin;
  if (dismissed.has(origin)) return;
  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      headers: { "X-Daytona-Skip-Preview-Warning": "true" },
    });
    dismissed.add(origin);
  } catch {
    // Silently ignore — the warning may still show but won't break functionality
  }
}
