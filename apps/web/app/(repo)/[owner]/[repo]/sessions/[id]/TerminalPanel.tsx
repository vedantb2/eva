"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Spinner } from "@conductor/ui";
import { IconRefresh, IconTerminal2 } from "@tabler/icons-react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
  devCommand?: string;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1000;

function getCssRgb(
  styles: CSSStyleDeclaration,
  variableName: string,
  fallback: string,
) {
  const raw = styles.getPropertyValue(variableName).trim();
  const value = raw.length > 0 ? raw : fallback;
  return `rgb(${value.split(/\s+/).join(", ")})`;
}

function getCssRgba(
  styles: CSSStyleDeclaration,
  variableName: string,
  alpha: number,
  fallback: string,
) {
  const raw = styles.getPropertyValue(variableName).trim();
  const value = raw.length > 0 ? raw : fallback;
  return `rgba(${value.split(/\s+/).join(", ")}, ${alpha})`;
}

function isControlMessage(
  data: unknown,
): data is { type: string; status: string; error?: string } {
  if (typeof data !== "object" || data === null || !("type" in data)) {
    return false;
  }
  const obj: Record<string, unknown> = Object.assign({}, data);
  return obj.type === "control";
}

export function TerminalPanel({
  sessionId,
  sandboxId,
  isActive,
  devCommand,
}: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intentionalCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const connectPty = useAction(api.pty.connectPty);
  const resizePtyAction = useAction(api.pty.resizePty);

  const typedSessionId = sessionId as Id<"sessions">;

  const resizePtyRef = useRef(resizePtyAction);
  resizePtyRef.current = resizePtyAction;

  const connectWebSocket = useCallback(
    async (terminal: Terminal, mounted: { current: boolean }) => {
      const { wsUrl, isNewPty } = await connectPty({
        sessionId: typedSessionId,
        cols: terminal.cols,
        rows: terminal.rows,
      });

      if (!mounted.current) return;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;
      const decoder = new TextDecoder();

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!terminalInstanceRef.current) return;

        if (typeof event.data === "string") {
          try {
            const parsed: unknown = JSON.parse(event.data);
            if (isControlMessage(parsed)) {
              if (parsed.status === "connected") {
                terminalInstanceRef.current.writeln(
                  "\x1b[32m* Connected to sandbox\x1b[0m\r\n",
                );
                if (
                  isNewPty &&
                  devCommand &&
                  ws.readyState === WebSocket.OPEN
                ) {
                  terminalInstanceRef.current.writeln(
                    "\x1b[33m* Starting dev server...\x1b[0m\r\n",
                  );
                  setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(devCommand + "\r");
                    }
                  }, 300);
                }
                return;
              }
              if (parsed.status === "error") {
                terminalInstanceRef.current.writeln(
                  `\x1b[31m* Error: ${parsed.error ?? "unknown"}\x1b[0m`,
                );
                return;
              }
              return;
            }
          } catch {
            // Not JSON - treat as terminal output
          }
          terminalInstanceRef.current.write(event.data);
        } else {
          terminalInstanceRef.current.write(
            decoder.decode(event.data, { stream: true }),
          );
        }
      };

      ws.onclose = () => {
        if (
          !mounted.current ||
          intentionalCloseRef.current ||
          reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS
        ) {
          return;
        }

        reconnectAttemptsRef.current++;
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(
            `\r\n\x1b[33m* Reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...\x1b[0m`,
          );
        }

        setTimeout(() => {
          if (mounted.current && terminalInstanceRef.current) {
            connectWebSocket(terminalInstanceRef.current, mounted).catch(
              () => {},
            );
          }
        }, RECONNECT_DELAY_MS);
      };

      terminal.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    },
    [connectPty, typedSessionId, devCommand],
  );

  useEffect(() => {
    if (!isActive || !sandboxId || !terminalRef.current) {
      return;
    }

    const mounted = { current: true };

    const initTerminal = async () => {
      setIsLoading(true);
      setError(null);
      intentionalCloseRef.current = false;
      reconnectAttemptsRef.current = 0;

      try {
        if (wsRef.current) {
          intentionalCloseRef.current = true;
          wsRef.current.close();
          wsRef.current = null;
        }
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
        }

        const rootStyles = getComputedStyle(document.documentElement);
        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          theme: {
            background: getCssRgb(rootStyles, "--card", "17 24 39"),
            foreground: getCssRgb(rootStyles, "--foreground", "226 232 240"),
            cursor: getCssRgb(rootStyles, "--primary", "16 145 130"),
            cursorAccent: getCssRgb(rootStyles, "--card", "17 24 39"),
            selectionBackground: getCssRgba(
              rootStyles,
              "--primary",
              0.26,
              "16 145 130",
            ),
          },
          allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.open(terminalRef.current!);

        terminalInstanceRef.current = terminal;
        fitAddonRef.current = fitAddon;

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            fitAddon.fit();
            resolve();
          }, 0);
        });

        for (let i = 0; i < terminal.rows - 1; i++) {
          terminal.writeln("");
        }
        terminal.writeln("\x1b[33m* Connecting to sandbox...\x1b[0m");

        await connectWebSocket(terminal, mounted);
      } catch (err) {
        if (mounted.current) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize terminal",
          );
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    initTerminal();

    return () => {
      mounted.current = false;
      intentionalCloseRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
    };
  }, [isActive, sandboxId, typedSessionId, retryCount, connectWebSocket]);

  useEffect(() => {
    if (!terminalRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (
        !entry ||
        entry.contentRect.width === 0 ||
        entry.contentRect.height === 0
      ) {
        return;
      }
      if (fitAddonRef.current && terminalInstanceRef.current) {
        fitAddonRef.current.fit();
        const { cols, rows } = terminalInstanceRef.current;
        resizePtyRef
          .current({ sessionId: typedSessionId, cols, rows })
          .catch(() => {});
      }
    });
    observer.observe(terminalRef.current);
    return () => observer.disconnect();
  }, [typedSessionId]);

  if (!isActive || !sandboxId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <IconTerminal2 className="h-12 w-12 opacity-50" />
        <p className="text-sm">
          {!isActive
            ? "Start the sandbox to use the terminal"
            : "Waiting for sandbox..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setRetryCount((c) => c + 1)}
        >
          <IconRefresh className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-card">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
          <Spinner size="lg" />
        </div>
      )}
      <div ref={terminalRef} className="min-h-0 flex-1" />
    </div>
  );
}
