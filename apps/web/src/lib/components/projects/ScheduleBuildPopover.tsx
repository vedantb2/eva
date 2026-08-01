"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent, Button } from "@eva/ui";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { IconCalendarClock } from "@tabler/icons-react";
import dayjs from "@eva/shared/dates";
import {
  ScheduleDateTimePicker,
  ScheduleDateTimeActions,
  useScheduleDateTime,
} from "@/lib/components/ScheduleDateTimePicker";

interface ScheduleBuildPopoverProps {
  projectId: Id<"projects">;
  scheduledBuildAt?: number;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function ScheduleBuildPopover({
  projectId,
  scheduledBuildAt,
  disabled,
  trigger,
}: ScheduleBuildPopoverProps) {
  const { selectedDate, setSelectedDate, time, setTime, timestamp, reset } =
    useScheduleDateTime(scheduledBuildAt);
  const [open, setOpen] = useState(false);

  const schedule = useMutation(api.buildWorkflow.scheduleBuild);
  const updateSchedule = useMutation(api.buildWorkflow.updateScheduledBuild);
  const cancelSchedule = useMutation(api.buildWorkflow.cancelScheduledBuild);

  const isScheduled = scheduledBuildAt !== undefined;

  async function handleSchedule() {
    if (!timestamp) return;
    if (isScheduled) {
      await updateSchedule({ projectId, scheduledAt: timestamp });
    } else {
      await schedule({ projectId, scheduledAt: timestamp });
    }
    setOpen(false);
  }

  async function handleRemove() {
    await cancelSchedule({ projectId });
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      reset(scheduledBuildAt);
    }
    setOpen(next);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger ?? (
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            className={isScheduled ? "text-primary" : undefined}
          >
            <IconCalendarClock className="size-4" />
            {isScheduled
              ? `Scheduled: ${dayjs(scheduledBuildAt).format("MMM D, h:mm A")}`
              : "Schedule Build"}
          </Button>
        )}
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
          scheduleLabel="Schedule"
          updateLabel="Update"
        />
      </PopoverContent>
    </Popover>
  );
}
