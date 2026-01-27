import { useState, useEffect, useRef, useCallback } from "react";
import { IconMapPin } from "@tabler/icons-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import type { ExtractedContext } from "@/shared/types";
import type { StoredPin } from "@/shared/messaging";

interface AnnotationPayload {
  title: string;
  pageUrl: string;
  position: { x: number; y: number };
  pinId: string;
  elementContext?: ExtractedContext;
}

interface AnnotationToolProps {
  onAnnotationTask: (payload: AnnotationPayload) => void;
}

export function AnnotationTool({ onAnnotationTask }: AnnotationToolProps) {
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [tabUrl, setTabUrl] = useState<string | null>(null);
  const lastPushedRef = useRef<string | null>(null);

  const pageUrl = tabUrl ? new URL(tabUrl).origin + new URL(tabUrl).pathname : null;

  const savedPins = useQuery(
    api.annotations.getByUrl,
    pageUrl ? { pageUrl } : "skip",
  );
  const saveAnnotations = useMutation(api.annotations.save);
  const removeAnnotations = useMutation(api.annotations.remove);

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
    const pins: Record<string, StoredPin> = savedPins ? JSON.parse(savedPins) : {};
    pushToContentScript(pins);
  }, [savedPins, pushToContentScript]);

  useEffect(() => {
    const handleMessage = (message: { type: string; payload?: AnnotationPayload | { pageUrl: string; pins: Record<string, StoredPin> } }) => {
      if (message.type === "SAVE_ANNOTATION_TASK" && message.payload) {
        onAnnotationTask(message.payload as AnnotationPayload);
      }
      if (message.type === "STOP_ANNOTATION") {
        setIsAnnotating(false);
      }
      if (message.type === "ANNOTATIONS_CHANGED" && message.payload) {
        const { pageUrl: url, pins } = message.payload as { pageUrl: string; pins: Record<string, StoredPin> };
        lastPushedRef.current = JSON.stringify(pins);
        if (Object.keys(pins).length === 0) {
          removeAnnotations({ pageUrl: url });
        } else {
          saveAnnotations({ pageUrl: url, pins: JSON.stringify(pins) });
        }
      }
      if (message.type === "REQUEST_ANNOTATIONS" && savedPins !== undefined) {
        lastPushedRef.current = null;
        const pins: Record<string, StoredPin> = savedPins ? JSON.parse(savedPins) : {};
        pushToContentScript(pins);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [onAnnotationTask, saveAnnotations, removeAnnotations, savedPins, pushToContentScript]);

  const handleClick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (isAnnotating) {
      chrome.tabs.sendMessage(tab.id, { type: "STOP_ANNOTATION" });
      setIsAnnotating(false);
    } else {
      lastPushedRef.current = null;
      chrome.tabs.sendMessage(tab.id, { type: "START_ANNOTATION" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to start annotation:", chrome.runtime.lastError);
          return;
        }
        if (response?.success) {
          setIsAnnotating(true);
        }
      });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={`relative p-2 rounded-lg transition-all duration-200 ${
            isAnnotating
              ? "bg-teal-600 text-white ring-2 ring-teal-500 ring-offset-2 ring-offset-background"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {isAnnotating && (
            <span className="absolute inset-0 rounded-lg animate-ping bg-teal-500 opacity-30" />
          )}
          <IconMapPin className="relative w-5 h-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{isAnnotating ? "Stop annotating" : "Annotate page"}</TooltipContent>
    </Tooltip>
  );
}
