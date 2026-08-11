"use client";

import { Popover, PopoverTrigger, PopoverContent, Calendar } from "@eva/ui";
import type { IconCalendar } from "@tabler/icons-react";
import dayjs from "@eva/shared/dates";
import { FIELD_ROW_CLASS } from "@/lib/components/fields/FieldsSection";

/** One project date (start / end) as a field row with a calendar popover. */
export function ProjectDateField({
  label,
  value,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number | undefined;
  icon: typeof IconCalendar;
  onChange: (epoch: number | null) => void;
}) {
  const selected = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`${FIELD_ROW_CLASS} w-full gap-1.5 text-[13px] ${!selected ? "text-muted-foreground" : ""}`}
        >
          <Icon size={14} className="text-muted-foreground" />
          <span>
            {selected ? dayjs(selected).format("MMM D, YYYY") : label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? date.getTime() : null)}
        />
      </PopoverContent>
    </Popover>
  );
}
