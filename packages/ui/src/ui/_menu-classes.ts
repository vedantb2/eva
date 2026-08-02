import { SURFACE_RADIUS_CLASS } from "../utils/surface-radius";

export const menuContentClass = [
  "z-50 min-w-[12rem] overflow-hidden border border-border bg-popover p-0.5 text-popover-foreground shadow-lg",
  SURFACE_RADIUS_CLASS,
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
].join(" ");

export const menuSubTriggerClass =
  "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-muted data-[state=open]:bg-muted [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const menuItemClass =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0";

export const menuCheckboxRadioItemClass =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-9 pr-2.5 text-sm outline-none transition-colors focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export const menuLabelClass =
  "px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export const menuSeparatorClass = "-mx-0.5 my-1.5 h-px bg-border";

export const menuShortcutClass =
  "ml-auto text-[11px] tracking-[0.08em] text-muted-foreground";
