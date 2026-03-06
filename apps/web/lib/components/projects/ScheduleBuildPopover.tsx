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

interface ScheduleBuildPopoverProps {
  projectId: Id<"projects">;
  scheduledBuildAt?: number;
  disabled?: boolean;
}

export function ScheduleBuildPopover({
  projectId,
  scheduledBuildAt,
  disabled,
}: ScheduleBuildPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    scheduledBuildAt ? new Date(scheduledBuildAt) : new Date(),
  );
  const [time, setTime] = useState(
    scheduledBuildAt
      ? dayjs(scheduledBuildAt).format("HH:mm")
      : dayjs().format("HH:mm"),
  );

  const schedule = useMutation(api.buildWorkflow.scheduleBuild);
  const updateSchedule = useMutation(api.buildWorkflow.updateScheduledBuild);
  const cancelSchedule = useMutation(api.buildWorkflow.cancelScheduledBuild);

  const isScheduled = scheduledBuildAt !== undefined;

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
      await updateSchedule({ projectId, scheduledAt: ts });
    } else {
      await schedule({ projectId, scheduledAt: ts });
    }
    setOpen(false);
  }

  async function handleRemove() {
    await cancelSchedule({ projectId });
    setSelectedDate(undefined);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setSelectedDate(
        scheduledBuildAt ? new Date(scheduledBuildAt) : new Date(),
      );
      setTime(
        scheduledBuildAt
          ? dayjs(scheduledBuildAt).format("HH:mm")
          : dayjs().format("HH:mm"),
      );
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
          <IconCalendarClock size={16} />
          {isScheduled
            ? `Scheduled: ${dayjs(scheduledBuildAt).format("MMM D, h:mm A")}`
            : "Schedule Build"}
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
