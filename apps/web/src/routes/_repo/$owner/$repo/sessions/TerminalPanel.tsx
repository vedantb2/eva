import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { Button, Spinner } from "@conductor/ui";
import { IconRefresh, IconTerminal2 } from "@tabler/icons-react";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useSessionStorage } from "usehooks-ts";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import {
  attachNormalBufferWheelScroll,
  buildTerminalHistoryKey,
  createTerminalHistoryWriter,
  startVercelPty,
  parseTerminalControlMessage,
  parseVercelExitMessage,
  sendVercelPtyControl,
  type PtyProtocol,
  type TerminalHistoryWriter,
} from "./_utils";

/**
 * Discriminated owner — a terminal pane belongs to a session, a quick task,
 * or a project. The PTY backend resolves the sandbox and repo from whichever
 * is provided.
 */
export type PtyOwner =
  | { kind: "session"; sessionId: Id<"sessions"> }
  | { kind: "task"; taskId: Id<"agentTasks"> }
  | { kind: "project"; projectId: Id<"projects"> };

interface TerminalPanelProps {
  owner: PtyOwner;
  sandboxId: string | undefined;
  isActive: boolean;
  ptyInstanceId: string;
  isForeground: boolean;
  runDevCommandOnConnect: boolean;
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

export function TerminalPanel({
  owner,
  sandboxId,
  isActive,
  ptyInstanceId,
  isForeground,
  runDevCommandOnConnect,
  devCommand,
}: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const ptyProtocolRef = useRef<PtyProtocol>("daytona");
  const intentionalCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const terminalHistoryKey = buildTerminalHistoryKey(
    owner,
    sandboxId ?? "no-sandbox",
    ptyInstanceId,
  );
  const [terminalHistory, setTerminalHistory] = useSessionStorage(
    terminalHistoryKey,
    "",
  );
  const terminalHistoryRef = useRef(terminalHistory);
  terminalHistoryRef.current = terminalHistory;

  const connectPty = useAction(api.pty.connectPty);
  const resizePtyAction = useAction(api.pty.resizePty);

  const resizePtyRef = useRef(resizePtyAction);
  resizePtyRef.current = resizePtyAction;

  const connectWebSocket = useCallback(
    async (
      terminal: Terminal,
      mounted: { current: boolean },
      historyWriter: TerminalHistoryWriter,
    ) => {
      const {
        wsUrl,
        isNewPty,
        ptyProtocol,
        sharedPtySessionName,
        initialOutput,
      } = await connectPty({
        owner,
        cols: terminal.cols,
        rows: terminal.rows,
        ptyInstanceId,
      });

      if (!mounted.current) return;

      ptyProtocolRef.current = ptyProtocol;
      if (ptyProtocol === "vercel") {
        historyWriter.clear();
        terminal.clear();
      }
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;
      if (initialOutput && initialOutput.length > 0) {
        terminal.write(initialOutput.replace(/\n/g, "\r\n"));
      }
      const decoder = new TextDecoder();
      let vercelHandshakeComplete = ptyProtocol !== "vercel";

      const markConnected = () => {
        if (!terminalInstanceRef.current) return;
        if (vercelHandshakeComplete && ptyProtocol === "vercel") return;
        if (ptyProtocol === "vercel") {
          vercelHandshakeComplete = true;
        }
        terminalInstanceRef.current.writeln(
          "\x1b[32m* Connected to sandbox\x1b[0m\r\n",
        );
        // Vercel Console attaches via tmux; sessions usually start the server
        // from the backend into that tmux session. Tasks/projects still auto-
        // start here when isNewPty (no prior tmux session).
        if (
          isNewPty &&
          runDevCommandOnConnect &&
          devCommand &&
          ws.readyState === WebSocket.OPEN
        ) {
          terminalInstanceRef.current.writeln(
            "\x1b[33m* Starting dev server...\x1b[0m\r\n",
          );
          setTimeout(
            () => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(devCommand + "\r");
              }
            },
            ptyProtocol === "vercel" ? 500 : 300,
          );
        }
      };

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        if (ptyProtocol === "vercel") {
          startVercelPty(ws, {
            cols: terminal.cols,
            rows: terminal.rows,
            sessionName: sharedPtySessionName,
          });
          // Wait for the interactive "connected" frame before auto-start so
          // tmux/bash is ready to receive the command.
        }
      };

      ws.onmessage = (event) => {
        if (!terminalInstanceRef.current) return;

        if (typeof event.data === "string") {
          const parsed = parseTerminalControlMessage(event.data);
          if (parsed) {
            if (parsed.status === "connected") {
              markConnected();
              return;
            }
            if (parsed.status === "error") {
              terminalInstanceRef.current.writeln(
                `\x1b[31m* Error: ${parsed.error ?? "terminal error"}\x1b[0m`,
              );
              return;
            }
            return;
          }
          const exitFrame = parseVercelExitMessage(event.data);
          if (exitFrame) {
            terminalInstanceRef.current.writeln(
              `\r\n\x1b[33m* Shell exited (${exitFrame.code ?? 0})\x1b[0m\r\n`,
            );
            return;
          }
          terminalInstanceRef.current.write(event.data);
          if (ptyProtocol !== "vercel") {
            historyWriter.append(event.data);
          }
        } else {
          const text = decoder.decode(event.data, { stream: true });
          terminalInstanceRef.current.write(text);
          if (ptyProtocol !== "vercel") {
            historyWriter.append(text);
          }
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
            connectWebSocket(
              terminalInstanceRef.current,
              mounted,
              historyWriter,
            ).catch(() => {});
          }
        }, RECONNECT_DELAY_MS);
      };
    },
    [connectPty, owner, devCommand, ptyInstanceId, runDevCommandOnConnect],
  );

  useEffect(() => {
    if (!isActive || !sandboxId || !terminalRef.current) {
      return;
    }

    const mounted = { current: true };
    const containerEl = terminalRef.current;
    const historyWriter = createTerminalHistoryWriter(setTerminalHistory);
    let detachWheelScroll = () => {};

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
        detachWheelScroll();
        detachWheelScroll = () => {};

        const rootStyles = getComputedStyle(document.documentElement);
        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          scrollback: 5000,
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
        terminal.open(containerEl);

        terminalInstanceRef.current = terminal;
        fitAddonRef.current = fitAddon;
        detachWheelScroll = attachNormalBufferWheelScroll(
          terminal,
          containerEl,
        );

        terminal.onData((data) => {
          const currentWs = wsRef.current;
          if (currentWs?.readyState === WebSocket.OPEN) {
            if (ptyProtocolRef.current === "vercel") {
              currentWs.send(new TextEncoder().encode(data));
            } else {
              currentWs.send(data);
            }
          }
        });

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            fitAddon.fit();
            resolve();
          }, 0);
        });

        const restoredHistory = terminalHistoryRef.current;
        if (restoredHistory.length > 0) {
          terminal.write(restoredHistory);
        }

        if (restoredHistory.length === 0) {
          for (let i = 0; i < terminal.rows - 1; i++) {
            terminal.writeln("");
          }
        }
        terminal.writeln("\x1b[33m* Connecting to sandbox...\x1b[0m");

        await connectWebSocket(terminal, mounted, historyWriter);
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

    void initTerminal();

    return () => {
      mounted.current = false;
      intentionalCloseRef.current = true;
      detachWheelScroll();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
      historyWriter.dispose();
    };
  }, [
    isActive,
    sandboxId,
    owner,
    retryCount,
    connectWebSocket,
    ptyInstanceId,
    setTerminalHistory,
  ]);

  useLayoutEffect(() => {
    if (!isForeground) {
      return;
    }
    if (!fitAddonRef.current || !terminalInstanceRef.current) {
      return;
    }
    fitAddonRef.current.fit();
    const { cols, rows } = terminalInstanceRef.current;
    if (
      ptyProtocolRef.current === "vercel" &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      sendVercelPtyControl(wsRef.current, { type: "resize", cols, rows });
    } else {
      resizePtyRef
        .current({ owner, cols, rows, ptyInstanceId })
        .catch(() => {});
    }
  }, [isForeground, owner, ptyInstanceId]);

  useEffect(() => {
    if (!terminalRef.current) {
      return;
    }
    const el = terminalRef.current;
    const observer = new ResizeObserver((entries) => {
      if (!isForeground) {
        return;
      }
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
        if (
          ptyProtocolRef.current === "vercel" &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          sendVercelPtyControl(wsRef.current, { type: "resize", cols, rows });
        } else {
          resizePtyRef
            .current({ owner, cols, rows, ptyInstanceId })
            .catch(() => {});
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [owner, ptyInstanceId, isForeground]);

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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-card">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
          <Spinner size="lg" />
        </div>
      )}
      <div ref={terminalRef} className="min-h-0 flex-1 overflow-hidden" />
    </div>
  );
}
