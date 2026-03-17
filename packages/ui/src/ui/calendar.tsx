"use client";

import * as React from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "rounded-lg border border-border/70 bg-card/90 p-3",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 text-muted-foreground aria-disabled:opacity-50 select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 text-muted-foreground aria-disabled:opacity-50 select-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-8 w-full px-8",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "select-none font-medium text-sm",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-lg flex-1 font-medium text-[0.76rem] uppercase tracking-[0.08em] select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        day: cn(
          "relative w-full h-full p-0 text-center aspect-square select-none",
          defaultClassNames.day,
        ),
        today: cn(
          "rounded-lg border border-primary/25 bg-primary/10 text-primary",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({
          className: chevronClassName,
          orientation,
          ...chevronProps
        }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
          return (
            <Icon
              className={cn("size-4", chevronClassName)}
              {...chevronProps}
            />
          );
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      data-selected={modifiers.selected}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-8 w-8 p-0 font-normal",
        "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary data-[selected=true]:hover:text-primary-foreground",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar };
