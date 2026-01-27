import { useEffect, useRef } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface SelectionToolProps {
  hasCapturedContext?: boolean;
  isActive: boolean;
  onActiveChange: (active: boolean) => void;
}

export function SelectionTool({ hasCapturedContext = false, isActive, onActiveChange }: SelectionToolProps) {
  const prevActiveRef = useRef(isActive);

  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === "ELEMENT_CAPTURED" || message.type === "SELECTION_CANCELLED") {
        onActiveChange(false);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [onActiveChange]);

  useEffect(() => {
    if (prevActiveRef.current && !isActive) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "STOP_SELECTION" });
      });
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  const handleClick = async () => {
    if (isActive) {
      onActiveChange(false);
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Failed to start selection:", chrome.runtime.lastError);
        return;
      }
      if (response?.success) {
        onActiveChange(true);
      }
    });
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
          {hasCapturedContext && !isActive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-background" />
          )}
          <svg className="relative w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent>{isActive ? "Cancel selection" : "Select element"}</TooltipContent>
    </Tooltip>
  );
}
