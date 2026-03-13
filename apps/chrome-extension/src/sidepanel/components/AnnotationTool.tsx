import { useState, useEffect, useRef, useCallback } from "react";
import { IconMapPin } from "@tabler/icons-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@conductor/ui";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { ExtractedContext } from "@/shared/types";
import { type StoredPin, isTaskId } from "@/shared/messaging";

interface AnnotationPayload {
  title: string;
  pageUrl: string;
  position: { x: number; y: number };
  pinId: string;
  elementContext?: ExtractedContext;
}

interface AnnotationToolProps {
  onAnnotationTask: (payload: AnnotationPayload) => void;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
}

export function AnnotationTool({
  onAnnotationTask,
  isActive,
  onActiveChange,
}: AnnotationToolProps) {
  const [tabUrl, setTabUrl] = useState<string | null>(null);
  const [trackedTaskIds, setTrackedTaskIds] = useState<Id<"agentTasks">[]>([]);
  const lastPushedRef = useRef<string | null>(null);
  const prevActiveRef = useRef(isActive);

  const pageUrl = tabUrl
    ? new URL(tabUrl).origin + new URL(tabUrl).pathname
    : null;

  const savedPins = useQuery(
    api.annotations.getByUrl,
    pageUrl ? { pageUrl } : "skip",
  );
  const saveAnnotations = useMutation(api.annotations.save);
  const removeAnnotations = useMutation(api.annotations.remove);

  const taskStatuses = useQuery(
    api.agentTasks.getStatusesByIds,
    trackedTaskIds.length > 0 ? { ids: trackedTaskIds } : "skip",
  );

  useEffect(() => {
    if (!taskStatuses || taskStatuses.length === 0) return;
    const updates: Record<string, { status: string }> = {};
    for (const { id, status } of taskStatuses) {
      updates[id] = { status };
    }
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "ANNOTATION_STATUS_SYNC",
          payload: { updates },
        });
      }
    });
  }, [taskStatuses]);

  useEffect(() => {
    if (savedPins === undefined) return;
    const pins: Record<string, StoredPin> = savedPins
      ? JSON.parse(savedPins)
      : {};
    const ids: Id<"agentTasks">[] = [];
    for (const p of Object.values(pins)) {
      if (p.taskId && isTaskId(p.taskId)) {
        ids.push(p.taskId);
      }
    }
    setTrackedTaskIds(ids);
  }, [savedPins]);

  useEffect(() => {
    const update = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        setTabUrl(tab?.url ?? null);
      });
    };
    update();
    chrome.tabs.onActivated.addListener(update);
    chrome.tabs.onUpdated.addListener((_tabId, info) => {
      if (info.url || info.status === "complete") update();
    });
  }, []);

  const pushToContentScript = useCallback((pins: Record<string, StoredPin>) => {
    const serialized = JSON.stringify(pins);
    if (lastPushedRef.current === serialized) return;
    lastPushedRef.current = serialized;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, {
        type: "ANNOTATIONS_LOADED",
        payload: { pins },
      });
    });
  }, []);

  useEffect(() => {
    lastPushedRef.current = null;
  }, [tabUrl]);

  useEffect(() => {
    if (savedPins === undefined) return;
    const pins: Record<string, StoredPin> = savedPins
      ? JSON.parse(savedPins)
      : {};
    pushToContentScript(pins);
  }, [savedPins, pushToContentScript]);

  useEffect(() => {
    const handleMessage = (message: {
      type: string;
      payload?: Record<string, unknown>;
    }) => {
      if (message.type === "SAVE_ANNOTATION_TASK" && message.payload) {
        const p = message.payload;
        if (
          typeof p.title === "string" &&
          typeof p.pageUrl === "string" &&
          typeof p.pinId === "string"
        ) {
          onAnnotationTask({
            title: p.title,
            pageUrl: p.pageUrl,
            position: (p.position ?? {
              x: 0,
              y: 0,
            }) as AnnotationPayload["position"],
            pinId: p.pinId,
            elementContext:
              p.elementContext as AnnotationPayload["elementContext"],
          });
        }
      }
      if (message.type === "STOP_ANNOTATION") {
        onActiveChange(false);
      }
      if (message.type === "ANNOTATIONS_CHANGED" && message.payload) {
        const p = message.payload;
        if (
          typeof p.pageUrl === "string" &&
          typeof p.pins === "object" &&
          p.pins !== null
        ) {
          const url = p.pageUrl;
          const pins = p.pins as Record<string, StoredPin>;
          lastPushedRef.current = JSON.stringify(pins);
          if (Object.keys(pins).length === 0) {
            removeAnnotations({ pageUrl: url });
          } else {
            saveAnnotations({ pageUrl: url, pins: JSON.stringify(pins) });
          }
        }
      }
      if (message.type === "REQUEST_ANNOTATIONS" && savedPins !== undefined) {
        lastPushedRef.current = null;
        const pins: Record<string, StoredPin> = savedPins
          ? JSON.parse(savedPins)
          : {};
        pushToContentScript(pins);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [
    onAnnotationTask,
    onActiveChange,
    saveAnnotations,
    removeAnnotations,
    savedPins,
    pushToContentScript,
  ]);

  useEffect(() => {
    if (prevActiveRef.current && !isActive) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id)
          chrome.tabs.sendMessage(tab.id, { type: "STOP_ANNOTATION" });
      });
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  const handleClick = async () => {
    if (isActive) {
      onActiveChange(false);
      return;
    }
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;
    lastPushedRef.current = null;
    chrome.tabs.sendMessage(
      tab.id,
      { type: "START_ANNOTATION" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to start annotation:",
            chrome.runtime.lastError,
          );
          return;
        }
        if (response?.success) {
          onActiveChange(true);
        }
      },
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={`relative p-2 rounded-lg transition-all duration-200 ${
            isActive
              ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {isActive && (
            <span className="absolute inset-0 rounded-lg animate-ping bg-primary opacity-30" />
          )}
          <IconMapPin className="relative w-5 h-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {isActive ? "Stop annotating" : "Annotate page"}
      </TooltipContent>
    </Tooltip>
  );
}
