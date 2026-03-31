const dismissed = new Set<string>();

export async function dismissDaytonaWarning(url: string): Promise<void> {
  const parsed = new URL(url);
  if (parsed.protocol === "http:") parsed.protocol = "https:";
  const httpsUrl = parsed.toString();
  const origin = parsed.origin;
  if (dismissed.has(origin)) return;
  try {
    await fetch(httpsUrl, {
      method: "HEAD",
      mode: "no-cors",
      headers: { "X-Daytona-Skip-Preview-Warning": "true" },
    });
    dismissed.add(origin);
  } catch {
    // Silently ignore — the warning may still show but won't break functionality
  }
}
