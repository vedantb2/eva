"use client";

import { useState } from "react";
import { IconWorld, IconTerminal2 } from "@tabler/icons-react";

export function UITestingPanel() {
  const [isRunning] = useState(false);
  const [logs] = useState<string[]>([]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-[60%]">
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary">
            <IconWorld size={48} className="mb-3 opacity-50" />
            <p className="text-sm">
              Enter a URL and run the test to see Eva interact with your UI
            </p>
          </div>
        </div>
        <div className="h-[40%] flex flex-col bg-background">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <IconTerminal2 size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Logs
            </span>
            {isRunning && (
              <span className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-400">Running</span>
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar p-3">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Test logs will appear here...
              </p>
            ) : (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all w-0 min-w-full">
                {logs.join("\n")}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
