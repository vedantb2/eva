import { SURFACE_RADIUS_CLASS } from "../utils/surface-radius";

/**
 * Scale+fade from the trigger, matching `PopoverContent` — menus and popovers are
 * the same class of non-modal overlay, so they move the same way.
 *
 * The exit is deliberately faster than the enter (75ms vs 150ms). An earlier
 * symmetric version made composer menus (traits, model) feel sticky on click:
 * the cost was the menu lingering *after* a selection, not the open itself, so
 * the fix is a quick outbound path rather than no motion at all.
 *
 * `origin` must be the Radix transform-origin var class for the specific
 * primitive — pass it literally so Tailwind can see it.
 */
export function menuContentClass(origin: string): string {
  return [
    "z-50 min-w-48 overflow-hidden bg-popover/95 p-1.5 text-popover-foreground backdrop-blur-md smooth-shadow-ring-lg",
    SURFACE_RADIUS_CLASS,
    origin,
    "duration-150 data-[state=closed]:duration-75 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
  ].join(" ");
}

export const menuSubTriggerClass =
  "flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm outline-hidden transition-colors motion-press active:scale-[0.98] focus:bg-muted data-[state=open]:bg-muted [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const menuItemClass =
  "relative flex cursor-pointer select-none items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm outline-hidden transition-colors motion-press active:scale-[0.98] focus:bg-muted focus:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0";

export const menuCheckboxRadioItemClass =
  "relative flex cursor-pointer select-none items-center gap-1.5 rounded-lg py-2 pl-9 pr-2.5 text-sm outline-hidden transition-colors motion-press active:scale-[0.98] focus:bg-muted focus:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

export const menuLabelClass =
  "px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em] text-muted-foreground";

export const menuSeparatorClass = "-mx-1.5 my-1.5 h-px bg-border";

export const menuShortcutClass =
  "ml-auto text-[11px] tracking-[0.08em] text-muted-foreground";
