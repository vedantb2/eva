"use client";

import { memo, useEffect, useState } from "react";
import { ActivityStepsTaskView } from "./activity-steps-task";
import { ActivityStepsTimelineView } from "./activity-steps-timeline";
import type {
  ActivityStep,
  ActivityStepsBaseProps,
  ActivityStepsVariant,
} from "./activity-steps-shared";

const SPINNER_VERBS = [
  "Reading",
  "Scanning",
  "Editing",
  "Checking",
  "Searching",
  "Running",
  "Working",
  "Preparing",
  "Reviewing",
  "Updating",
];

function getRandomVerb(): string {
  return (
    SPINNER_VERBS[Math.floor(Math.random() * SPINNER_VERBS.length)] ?? "Working"
  );
}

function useSpinnerVerb(active: boolean): string {
  const [verb, setVerb] = useState(getRandomVerb);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setVerb(getRandomVerb());
    }, 3000);
    return () => clearInterval(id);
  }, [active]);

  return verb;
}

export function useElapsedSeconds(
  startedAt: number | undefined,
  active: boolean,
) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) {
      setElapsed(0);
      return;
    }

    setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  return elapsed;
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

function formatActivityHeader({
  isStreaming,
  name,
  startedAt,
  duration,
  elapsed,
  verb,
  stepsLength,
}: {
  isStreaming: boolean;
  name: string | undefined;
  startedAt: number | undefined;
  duration: string | undefined;
  elapsed: number;
  verb: string;
  stepsLength: number;
}): string {
  const itemText = `${stepsLength} ${stepsLength === 1 ? "item" : "items"}`;
  const timeText =
    isStreaming && startedAt
      ? formatElapsed(elapsed)
      : !isStreaming && duration
        ? duration
        : null;

  if (isStreaming) {
    const title = name ? `${name} is ${verb.toLowerCase()}` : verb;
    return timeText ? `${title} (${itemText} - ${timeText})` : `${title}`;
  }

  const title = name
    ? `${name} completed ${itemText}`
    : `Completed ${itemText}`;
  return timeText ? `${title} in ${timeText}` : title;
}

function formatTaskHeader({
  isStreaming,
  name,
  stepsLength,
}: {
  isStreaming: boolean;
  name: string | undefined;
  stepsLength: number;
}): string {
  if (isStreaming) return name ? `${name} in progress` : "Working";
  const itemText = `${stepsLength} ${stepsLength === 1 ? "item" : "items"}`;
  return name ? `${name} completed` : `Completed ${itemText}`;
}

export interface ActivityStepsProps extends ActivityStepsBaseProps {
  variant?: ActivityStepsVariant;
}

export const ActivitySteps = memo(
  ({
    steps,
    isStreaming = false,
    name,
    startedAt,
    duration,
    variant = "task",
    ...props
  }: ActivityStepsProps) => {
    const [open, setOpen] = useState(isStreaming);
    const elapsed = useElapsedSeconds(startedAt, isStreaming);
    const verb = useSpinnerVerb(isStreaming);

    useEffect(() => {
      setOpen(isStreaming);
    }, [isStreaming]);

    if (steps.length === 0) return null;

    const timelineHeaderLabel = formatActivityHeader({
      isStreaming,
      name,
      startedAt,
      duration,
      elapsed,
      verb,
      stepsLength: steps.length,
    });
    const taskHeaderLabel = formatTaskHeader({
      isStreaming,
      name,
      stepsLength: steps.length,
    });

    const viewProps = {
      ...props,
      duration,
      headerLabel:
        variant === "timeline" ? timelineHeaderLabel : taskHeaderLabel,
      isStreaming,
      name,
      onOpenChange: setOpen,
      open,
      startedAt,
      steps,
    };

    return variant === "timeline" ? (
      <ActivityStepsTimelineView {...viewProps} />
    ) : (
      <ActivityStepsTaskView {...viewProps} />
    );
  },
);

ActivitySteps.displayName = "ActivitySteps";
export { ActivityStepsTaskView } from "./activity-steps-task";
export type { ActivityStep, ActivityStepsVariant };
