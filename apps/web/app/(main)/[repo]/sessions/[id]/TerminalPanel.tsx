"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@conductor/ui";
import { IconRefresh, IconTerminal2 } from "@tabler/icons-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  sessionId: string;
  sandboxId: string | undefined;
  isActive: boolean;
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

async function fetchWsUrl(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<{ wsUrl: string; ptySessionId: string }> {
  type TerminalWsResponse = { wsUrl: string; ptySessionId: string };
  type TerminalErrorResponse = { error?: string };
  const params = new URLSearchParams({
    sessionId,
    cols: String(cols),
    rows: String(rows),
  });
  const response = await fetch(`/api/sessions/terminal?${params}`, {
    credentials: "include",
    cache: "no-store",
  });
  const data: TerminalWsResponse | TerminalErrorResponse =
    await response.json();
  if (!response.ok) {
    const errorMessage =
      "error" in data && typeof data.error === "string"
        ? data.error
        : "Failed to get terminal URL";
    throw new Error(errorMessage);
  }
  if (
    !("wsUrl" in data) ||
    !("ptySessionId" in data) ||
    typeof data.wsUrl !== "string" ||
    typeof data.ptySessionId !== "string"
  ) {
    throw new Error("Invalid terminal URL response");
  }
  return { wsUrl: data.wsUrl, ptySessionId: data.ptySessionId };
}

export function TerminalPanel({
  sessionId,
  sandboxId,
  isActive,
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

  useEffect(() => {
    if (!isActive || !sandboxId || !terminalRef.current) {
      return;
    }

    let isMounted = true;
    const decoder = new TextDecoder();

    const connectWebSocket = async (terminal: Terminal) => {
      const { wsUrl } = await fetchWsUrl(
        sessionId,
        terminal.cols,
        terminal.rows,
      );

      if (!isMounted) {
        return;
      }

      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!terminalInstanceRef.current) {
          return;
        }

        if (typeof event.data === "string") {
          try {
            const parsed: unknown = JSON.parse(event.data);
            if (isControlMessage(parsed)) {
              if (parsed.status === "connected") {
                terminalInstanceRef.current.writeln(
                  "\x1b[32m* Connected to sandbox\x1b[0m\r\n",
                );
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
          !isMounted ||
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
          if (isMounted && terminalInstanceRef.current) {
            connectWebSocket(terminalInstanceRef.current).catch(() => {});
          }
        }, RECONNECT_DELAY_MS);
      };

      terminal.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    };

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
        const terminalElement = terminalRef.current;
        if (!terminalElement) {
          throw new Error("Terminal container is unavailable");
        }
        terminal.open(terminalElement);

        setTimeout(() => fitAddon.fit(), 0);

        terminalInstanceRef.current = terminal;
        fitAddonRef.current = fitAddon;

        terminal.writeln("\x1b[33m* Connecting to sandbox...\x1b[0m");

        await connectWebSocket(terminal);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize terminal",
          );
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
      intentionalCloseRef.current = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
      fetch("/api/sessions/terminal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "disconnect" }),
      }).catch(() => {});
    };
  }, [isActive, sandboxId, sessionId, retryCount]);

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
        fetch("/api/sessions/terminal", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, action: "resize", cols, rows }),
        }).catch(() => {});
      }
    });
    observer.observe(terminalRef.current);
    return () => observer.disconnect();
  }, [sessionId]);

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

  return (
    <div className="relative flex h-full flex-col bg-card">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-card">
          <Spinner size="lg" />
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-card text-muted-foreground">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setError(null);
              setRetryCount((c) => c + 1);
            }}
          >
            <IconRefresh className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}
      <div ref={terminalRef} className="min-h-0 flex-1" />
    </div>
  );
}
