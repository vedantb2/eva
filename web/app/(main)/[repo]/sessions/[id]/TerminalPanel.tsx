"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { IconRefresh, IconTerminal2 } from "@tabler/icons-react";
import { Button } from "@heroui/button";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
}

export function TerminalPanel({ sessionId, sandboxId, isActive }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !sandboxId || !terminalRef.current) {
      return;
    }

    let isMounted = true;

    const initTerminal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
        }
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        connectedRef.current = false;

        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          theme: {
            background: "#1a1a1a",
            foreground: "#f0f0f0",
            cursor: "#f0f0f0",
            cursorAccent: "#1a1a1a",
            selectionBackground: "#3a3a3a",
          },
          allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.open(terminalRef.current!);

        setTimeout(() => {
          fitAddon.fit();
        }, 0);

        terminalInstanceRef.current = terminal;
        fitAddonRef.current = fitAddon;

        terminal.writeln("\x1b[33m● Connecting to sandbox...\x1b[0m");

        const connectToTerminal = async () => {
          const response = await fetch("/api/sessions/terminal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              cols: terminal.cols,
              rows: terminal.rows,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to initialize terminal");
          }

          return data;
        };

        const data = await connectToTerminal();

        if (!isMounted) return;

        if (data.connected) {
          connectedRef.current = true;
          terminal.writeln("\x1b[32m● Connected to sandbox\x1b[0m\r\n");

          if (data.output) {
            terminal.write(data.output);
          }

          terminal.onData(async (inputData) => {
            if (!connectedRef.current) return;

            try {
              const response = await fetch("/api/sessions/terminal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, action: "input", input: inputData }),
              });
              const result = await response.json();
              if (result.output && terminalInstanceRef.current) {
                terminalInstanceRef.current.write(result.output);
              }
            } catch {
              // Ignore input errors
            }
          });

          pollingRef.current = setInterval(async () => {
            if (!connectedRef.current || !isMounted) return;

            try {
              const response = await fetch("/api/sessions/terminal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, action: "poll" }),
              });
              const result = await response.json();

              if (!result.connected && connectedRef.current) {
                connectedRef.current = false;
                if (terminalInstanceRef.current) {
                  terminalInstanceRef.current.writeln("\r\n\x1b[33m● Reconnecting...\x1b[0m");
                }
                try {
                  const reconnectData = await connectToTerminal();
                  if (reconnectData.connected && isMounted) {
                    connectedRef.current = true;
                    if (terminalInstanceRef.current) {
                      terminalInstanceRef.current.writeln("\x1b[32m● Reconnected\x1b[0m\r\n");
                      if (reconnectData.output) {
                        terminalInstanceRef.current.write(reconnectData.output);
                      }
                    }
                  }
                } catch {
                  // Will retry on next poll
                }
                return;
              }

              if (result.output && terminalInstanceRef.current) {
                terminalInstanceRef.current.write(result.output);
              }
            } catch {
              // Ignore polling errors
            }
          }, 200);
        } else {
          terminal.writeln("\x1b[31m● Failed to connect\x1b[0m");
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize terminal");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initTerminal();

    return () => {
      isMounted = false;
      connectedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
      fetch("/api/sessions/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "disconnect" }),
      }).catch(() => {});
    };
  }, [isActive, sandboxId, sessionId, retryCount]);

  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && terminalInstanceRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isActive || !sandboxId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3">
        <IconTerminal2 className="w-12 h-12 opacity-50" />
        <p className="text-sm">
          {!isActive ? "Start the sandbox to use the terminal" : "Waiting for sandbox..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <Button
          size="sm"
          variant="flat"
          onPress={() => setRetryCount((c) => c + 1)}
          startContent={<IconRefresh className="w-4 h-4" />}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-10">
          <Spinner size="lg" />
        </div>
      )}
      <div ref={terminalRef} className="flex-1 min-h-0" />
    </div>
  );
}
