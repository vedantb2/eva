/** Pull-request state as it reaches the sidebar (undefined = no PR yet). */
export type SidebarPrState = "draft" | "open" | "merged" | "closed" | undefined;

/** Human label for a PR state, used in tooltips and hover cards. */
export function prStateLabel(state: SidebarPrState): string {
  switch (state) {
    case "open":
      return "Open";
    case "merged":
      return "Merged";
    case "closed":
      return "Closed";
    case "draft":
      return "Draft";
    default:
      return "PR";
  }
}

/**
 * Token class for the PR glyph. The glyph carries the colour so the row's
 * text can stay neutral — the same trade StatusDot makes elsewhere.
 */
export function prStateIconColor(state: SidebarPrState): string {
  switch (state) {
    case "open":
      return "text-success";
    case "merged":
      return "text-status-code-review";
    case "closed":
      return "text-destructive";
    case "draft":
    default:
      return "text-muted-foreground";
  }
}
