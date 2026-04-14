export const menuContentClass =
  "z-50 min-w-[12rem] overflow-hidden rounded-lg border border-border/70 bg-popover/95 p-1.5 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";

export const menuSubTriggerClass =
  "flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent/85 data-[state=open]:bg-accent/85 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const menuItemClass =
  "relative flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent/85 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0";

export const menuCheckboxRadioItemClass =
  "relative flex cursor-default select-none items-center rounded-lg py-2 pl-9 pr-2.5 text-sm outline-none transition-colors focus:bg-accent/85 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export const menuLabelClass =
  "px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export const menuSeparatorClass = "-mx-0.5 my-1.5 h-px bg-border/70";

export const menuShortcutClass =
  "ml-auto text-[11px] tracking-[0.08em] text-muted-foreground";
