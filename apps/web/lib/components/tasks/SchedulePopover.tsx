"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent, Button } from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { IconCalendarClock } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import {
  ScheduleDateTimePicker,
  ScheduleDateTimeActions,
  useScheduleDateTime,
} from "@/lib/components/ScheduleDateTimePicker";

interface SchedulePopoverProps {
  taskId: Id<"agentTasks">;
  scheduledAt?: number;
  disabled?: boolean;
}

export function SchedulePopover({
  taskId,
  scheduledAt,
  disabled,
}: SchedulePopoverProps) {
  const { selectedDate, setSelectedDate, time, setTime, timestamp, reset } =
    useScheduleDateTime(scheduledAt);
  const [open, setOpen] = useState(false);

  const schedule = useMutation(api.agentTasks.scheduleExecution);
  const updateSchedule = useMutation(api.agentTasks.updateScheduledExecution);
  const cancelSchedule = useMutation(api.agentTasks.cancelScheduledExecution);

  const isScheduled = scheduledAt !== undefined;

  async function handleSchedule() {
    if (!timestamp) return;
    if (isScheduled) {
      await updateSchedule({ id: taskId, scheduledAt: timestamp });
    } else {
      await schedule({ id: taskId, scheduledAt: timestamp });
    }
    setOpen(false);
  }

  async function handleRemove() {
    await cancelSchedule({ id: taskId });
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      reset(scheduledAt);
    }
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          className={isScheduled ? "text-primary" : undefined}
        >
          <IconCalendarClock size={18} />
          {isScheduled
            ? dayjs(scheduledAt).format("MMM D, h:mm A")
            : "Schedule"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <ScheduleDateTimePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          time={time}
          onTimeChange={setTime}
          timestamp={timestamp}
        />
        <ScheduleDateTimeActions
          isScheduled={isScheduled}
          timestamp={timestamp}
          onSchedule={handleSchedule}
          onRemove={handleRemove}
        />
      </PopoverContent>
    </Popover>
  );
}
