import type { ExtensionAppearance } from "./theme";

/** Panel / card surface (bg + border + text). */
export function surfaceClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") {
    return "bg-white border-neutral-200 text-neutral-800";
  }
  if (appearance === "neutral") {
    return "bg-[#303134] border-[#4e4f52] text-[#fafafa]";
  }
  return "bg-neutral-800 border-neutral-700 text-neutral-100";
}

/** Muted label / secondary text. */
export function subtleTextClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "text-neutral-500";
  if (appearance === "neutral") return "text-[#9fa0a2]";
  return "text-neutral-400";
}

/** Form input surface. */
export function inputClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") {
    return "bg-neutral-50 border-neutral-200 text-neutral-800 placeholder-neutral-400";
  }
  if (appearance === "neutral") {
    return "bg-[#3a3b3e] border-[#4e4f52] text-[#fafafa] placeholder-[#9fa0a2]";
  }
  return "bg-neutral-900 text-neutral-100 border-neutral-700 placeholder-neutral-500";
}

/** Inactive list / secondary button surface. */
export function secondaryButtonClasses(
  appearance: ExtensionAppearance,
): string {
  if (appearance === "light") {
    return "bg-neutral-50 border-neutral-200 hover:bg-neutral-100";
  }
  if (appearance === "neutral") {
    return "bg-[#3a3b3e] border-[#4e4f52] hover:bg-[#48494c]";
  }
  return "bg-neutral-900 border-neutral-700 hover:bg-neutral-700";
}

/** Toolbar pill background. */
export function toolbarBackground(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "rgba(255, 255, 255, 0.9)";
  if (appearance === "neutral") return "rgba(34, 35, 37, 0.92)";
  return "rgba(0, 0, 0, 0.85)";
}

/** Toolbar pill border. */
export function toolbarBorder(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "1px solid rgba(0,0,0,0.08)";
  if (appearance === "neutral") return "1px solid #4e4f52";
  return "1px solid rgba(255,255,255,0.1)";
}

/** Toolbar pill text color. */
export function toolbarTextColor(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "#27272a";
  if (appearance === "neutral") return "#fafafa";
  return "#e4e4e7";
}

/** Toolbar pill box shadow. */
export function toolbarBoxShadow(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "0 4px 24px rgba(0,0,0,0.1)";
  if (appearance === "neutral") return "0 4px 24px rgba(0,0,0,0.2)";
  return "0 4px 24px rgba(0,0,0,0.25)";
}

/** Toolbar vertical divider. */
export function toolbarDividerBackground(
  appearance: ExtensionAppearance,
): string {
  if (appearance === "light") return "rgba(0,0,0,0.1)";
  if (appearance === "neutral") return "rgba(255,255,255,0.12)";
  return "rgba(255,255,255,0.15)";
}

/** Toolbar inactive icon / count text. */
export function toolbarMutedColor(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "#71717a";
  if (appearance === "neutral") return "#9fa0a2";
  return "#a1a1aa";
}

/** Toolbar mode button inactive text class. */
export function toolbarIconClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "text-neutral-500";
  if (appearance === "neutral") return "text-[#9fa0a2]";
  return "text-neutral-400";
}

/** Card panel background only (AnnotationOverlay input card). */
export function cardPanelClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "bg-white border-neutral-200";
  if (appearance === "neutral") return "bg-[#303134] border-[#4e4f52]";
  return "bg-neutral-800 border-neutral-700";
}

/** Card panel box shadow. */
export function cardPanelShadow(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "0 8px 32px rgba(0,0,0,0.12)";
  if (appearance === "neutral") return "0 8px 32px rgba(0,0,0,0.3)";
  return "0 8px 32px rgba(0,0,0,0.4)";
}

/** Card footer border. */
export function cardFooterBorderClasses(
  appearance: ExtensionAppearance,
): string {
  if (appearance === "light") return "border-neutral-100";
  if (appearance === "neutral") return "border-[#4e4f52]";
  return "border-neutral-700";
}

/** Card action button (cancel / secondary). */
export function cardActionButtonClasses(
  appearance: ExtensionAppearance,
): string {
  if (appearance === "light") {
    return "bg-neutral-100 text-neutral-600 hover:bg-neutral-200";
  }
  if (appearance === "neutral") {
    return "bg-[#3a3b3e] text-[#9fa0a2] hover:bg-[#48494c]";
  }
  return "bg-neutral-700 text-neutral-300 hover:bg-neutral-600";
}

/** Card primary secondary action (edit task). */
export function cardEditButtonClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") {
    return "bg-neutral-200 text-neutral-700 hover:bg-neutral-300";
  }
  if (appearance === "neutral") {
    return "bg-[#48494c] text-[#fafafa] hover:bg-[#56575a]";
  }
  return "bg-neutral-700 text-neutral-200 hover:bg-neutral-600";
}

/** Card body / quote text. */
export function cardBodyTextClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "text-neutral-700";
  if (appearance === "neutral") return "text-[#fafafa]";
  return "text-neutral-200";
}

/** Card delete link. */
export function cardDeleteClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "text-red-500 hover:text-red-600";
  if (appearance === "neutral") return "text-red-400 hover:text-red-300";
  return "text-red-400 hover:text-red-300";
}

/** Card details toggle link. */
export function cardDetailsLinkClasses(
  appearance: ExtensionAppearance,
): string {
  if (appearance === "light") {
    return "text-neutral-500 hover:text-neutral-600";
  }
  if (appearance === "neutral") {
    return "text-[#9fa0a2] hover:text-[#fafafa]";
  }
  return "text-neutral-400 hover:text-neutral-300";
}

/**
 * Selection overlay info card — inverted contrast against the page.
 * Light page → dark tooltip; dark page → light tooltip; neutral → elevated card.
 */
export function contrastPanelClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") {
    return "bg-neutral-800 text-neutral-100 border-neutral-700";
  }
  if (appearance === "neutral") {
    return "bg-[#3a3b3e] text-[#fafafa] border-[#4e4f52]";
  }
  return "bg-white text-neutral-800 border-neutral-200";
}

/** Selection overlay info card box shadow (inverted contrast). */
export function contrastPanelShadow(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "0 2px 12px rgba(255,255,255,0.15)";
  if (appearance === "neutral") return "0 2px 12px rgba(0,0,0,0.3)";
  return "0 2px 12px rgba(0,0,0,0.25)";
}

/** Selection overlay secondary line (inverted). */
export function contrastSubtleClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "text-neutral-400";
  if (appearance === "neutral") return "text-[#9fa0a2]";
  return "text-neutral-500";
}

/** Selection overlay tertiary line (inverted). */
export function contrastMutedClasses(appearance: ExtensionAppearance): string {
  if (appearance === "light") return "text-neutral-500";
  if (appearance === "neutral") return "text-[#9fa0a2]";
  return "text-neutral-400";
}
