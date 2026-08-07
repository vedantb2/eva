import { SURFACE_RADIUS_CLASS } from "../utils/surface-radius";

export const menuContentClass = [
  "z-50 min-w-48 overflow-hidden bg-popover/95 p-1.5 text-popover-foreground backdrop-blur-md smooth-shadow-ring-lg",
  SURFACE_RADIUS_CLASS,
  // No open/close animation — zoom+fade made composer menus (traits, model)
  // feel sticky on click; instant open matches the expected control feel.
].join(" ");

export const menuSubTriggerClass =
  "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-hidden transition-colors motion-press active:scale-[0.98] focus:bg-muted data-[state=open]:bg-muted [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const menuItemClass =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-hidden transition-colors motion-press active:scale-[0.98] focus:bg-muted focus:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0";

export const menuCheckboxRadioItemClass =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-9 pr-2.5 text-sm outline-hidden transition-colors motion-press active:scale-[0.98] focus:bg-muted focus:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

export const menuLabelClass =
  "px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export const menuSeparatorClass = "-mx-1.5 my-1.5 h-px bg-border";

export const menuShortcutClass =
  "ml-auto text-[11px] tracking-[0.08em] text-muted-foreground";
