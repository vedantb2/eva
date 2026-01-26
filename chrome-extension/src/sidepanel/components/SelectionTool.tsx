import { useState } from "react";

export function SelectionTool() {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleClick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (isSelecting) {
      chrome.tabs.sendMessage(tab.id, { type: "STOP_SELECTION" });
      setIsSelecting(false);
    } else {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch {
        // Content script may already be injected
      }

      chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to start selection:", chrome.runtime.lastError);
          return;
        }
        if (response?.success) {
          setIsSelecting(true);
        }
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-lg transition-colors ${
        isSelecting
          ? "bg-neutral-600 text-white"
          : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
      }`}
      title={isSelecting ? "Cancel selection" : "Select element"}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </svg>
    </button>
  );
}
