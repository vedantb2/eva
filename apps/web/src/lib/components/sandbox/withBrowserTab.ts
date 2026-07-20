import type { SandboxTab } from "@/lib/search-params";

/** Inserts the Browser tab after Preview in an enabled-tab set. */
export function withBrowserTab(
  tabs: ReadonlyArray<SandboxTab>,
): ReadonlyArray<SandboxTab> {
  const out: SandboxTab[] = [];
  for (const tab of tabs) {
    out.push(tab);
    if (tab === "preview") out.push("browser");
  }
  return out;
}
