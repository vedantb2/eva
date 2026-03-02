"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Calendar,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { IconCalendarClock } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";

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
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    scheduledAt ? new Date(scheduledAt) : undefined,
  );
  const [time, setTime] = useState(
    scheduledAt ? dayjs(scheduledAt).format("HH:mm") : "09:00",
  );

  const schedule = useMutation(api.agentTasks.scheduleExecution);
  const updateSchedule = useMutation(api.agentTasks.updateScheduledExecution);
  const cancelSchedule = useMutation(api.agentTasks.cancelScheduledExecution);

  const isScheduled = scheduledAt !== undefined;

  function getTimestamp(): number | null {
    if (!selectedDate) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const combined = dayjs(selectedDate)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0);
    if (combined.valueOf() <= Date.now()) return null;
    return combined.valueOf();
  }

  async function handleSchedule() {
    const ts = getTimestamp();
    if (!ts) return;
    if (isScheduled) {
      await updateSchedule({ id: taskId, scheduledAt: ts });
    } else {
      await schedule({ id: taskId, scheduledAt: ts });
    }
    setOpen(false);
  }

  async function handleRemove() {
    await cancelSchedule({ id: taskId });
    setSelectedDate(undefined);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setSelectedDate(scheduledAt ? new Date(scheduledAt) : undefined);
      setTime(scheduledAt ? dayjs(scheduledAt).format("HH:mm") : "09:00");
    }
    setOpen(next);
  }

  const ts = getTimestamp();

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
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={{ before: new Date() }}
          className="border-0 shadow-none"
        />
        <div className="border-t px-3 py-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
            />
          </label>
          <div className="flex gap-2">
            {isScheduled ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                  className="flex-1"
                >
                  Remove
                </Button>
                <Button
                  size="sm"
                  onClick={handleSchedule}
                  disabled={!ts}
                  className="flex-1"
                >
                  Update
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleSchedule}
                disabled={!ts}
                className="w-full"
              >
                Schedule
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
