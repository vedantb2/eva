"use client";

import { useState } from "react";
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewConsole,
} from "@conductor/ui";
import { IconWorld } from "@tabler/icons-react";

export function UITestingPanel() {
  const [isRunning] = useState(false);
  const [logs] = useState<
    { level: "log" | "warn" | "error"; message: string; timestamp: Date }[]
  >([]);

  return (
    <WebPreview className="h-full rounded-none border-0">
      <WebPreviewNavigation>
        <WebPreviewUrl
          placeholder="Enter URL to test..."
          className="h-8 text-xs"
        />
      </WebPreviewNavigation>
      <div className="flex-1 min-h-0 relative">
        <WebPreviewBody
          loading={
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-secondary">
              <IconWorld size={48} className="mb-3 opacity-50" />
              <p className="text-sm">
                Enter a URL and run the test to see Eva interact with your UI
              </p>
            </div>
          }
        />
      </div>
      <WebPreviewConsole logs={logs}>
        {isRunning && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success">Running</span>
          </div>
        )}
      </WebPreviewConsole>
    </WebPreview>
  );
}
