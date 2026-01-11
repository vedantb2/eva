"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface LogEntry {
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
}

const levelColors = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LogViewer({ logs, className }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className={cn("p-4 text-sm text-neutral-500 dark:text-neutral-400 italic", className)}>
        No logs yet...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-neutral-900 dark:bg-neutral-950 rounded-lg p-3 overflow-auto font-mono text-xs",
        className
      )}
    >
      {logs.map((log, index) => (
        <div key={index} className="flex gap-2 py-0.5">
          <span className="text-neutral-500 shrink-0">{formatTime(log.timestamp)}</span>
          <span className={cn("shrink-0 uppercase w-12", levelColors[log.level])}>
            [{log.level}]
          </span>
          <span className="text-neutral-200 whitespace-pre-wrap break-all">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
