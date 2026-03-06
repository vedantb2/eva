"use client";

import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Calendar,
  Spinner,
} from "@conductor/ui";
import dayjs from "@conductor/shared/dates";

interface ScheduleTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskIds: Set<Id<"agentTasks">>;
  onSuccess: () => void;
}

export function ScheduleTasksModal({
  isOpen,
  onClose,
  selectedTaskIds,
  onSuccess,
}: ScheduleTasksModalProps) {
  const schedule = useMutation(api.agentTasks.scheduleExecution);
  const updateSchedule = useMutation(api.agentTasks.updateScheduledExecution);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [time, setTime] = useState(dayjs().format("HH:mm"));

  const count = selectedTaskIds.size;

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

  const ts = getTimestamp();

  const handleSchedule = async () => {
    if (!ts) return;
    setIsLoading(true);
    setError(null);
    try {
      const taskIds = [...selectedTaskIds];
      const results = await Promise.all(
        taskIds.map(async (id) => {
          try {
            await schedule({ id, scheduledAt: ts });
            return true;
          } catch {
            // Task might already be scheduled, try updating instead
            try {
              await updateSchedule({ id, scheduledAt: ts });
              return true;
            } catch (updateErr) {
              console.error(`Failed to schedule task ${id}:`, updateErr);
              return false;
            }
          }
        }),
      );
      const scheduledCount = results.filter(Boolean).length;
      if (scheduledCount === count) {
        onSuccess();
        handleClose();
        return;
      }
      if (scheduledCount === 0) {
        setError(
          "Failed to schedule any selected tasks. Only todo tasks can be scheduled.",
        );
      } else {
        setError(
          `Scheduled ${scheduledCount} of ${count} tasks. ${count - scheduledCount} failed (may not be in todo status).`,
        );
      }
    } catch (err) {
      console.error("Failed to schedule tasks:", err);
      setError("Failed to schedule selected tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  function handleClose() {
    setError(null);
    setSelectedDate(new Date());
    setTime(dayjs().format("HH:mm"));
    onClose();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Schedule {count} task{count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Set a date and time to run the selected task
            {count === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={{ before: new Date() }}
          className="border rounded-md shadow-none mx-auto"
        />
        <div className="px-1">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
            />
          </label>
        </div>
        {ts && (
          <p className="text-sm text-muted-foreground px-1">
            Tasks will run at{" "}
            <span className="font-medium text-foreground">
              {dayjs(ts).format("MMM D, h:mm A")}
            </span>
          </p>
        )}
        {error && <p className="text-sm text-destructive px-1">{error}</p>}
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading || !ts}>
            {isLoading && <Spinner size="sm" />}
            Schedule {count} task{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
