import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface AgentTerminalProps {
  ptyId: string;
  cwd: string;
}

export function AgentTerminal({ ptyId, cwd }: AgentTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      theme: {
        background: "#1a1a1a",
        foreground: "#e5e5e5",
        cursor: "#7dd3c8",
        selectionBackground: "#3a3a3a",
        black: "#1a1a1a",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#facc15",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#7dd3c8",
        white: "#e5e5e5",
        brightBlack: "#404040",
        brightRed: "#fca5a5",
        brightGreen: "#86efac",
        brightYellow: "#fde047",
        brightBlue: "#93c5fd",
        brightMagenta: "#d8b4fe",
        brightCyan: "#99f6e4",
        brightWhite: "#f5f5f5",
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon((_, url) => {
      window.electronAPI.openExternal(url);
    });

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(container);
    fitAddon.fit();

    // Spawn PTY in main process
    window.electronAPI
      .ptySpawn({ ptyId, cwd, cols: term.cols, rows: term.rows })
      .catch(console.error);

    // User input → PTY
    const dataDisposable = term.onData((data) => {
      window.electronAPI.ptyInput(ptyId, data);
    });

    // PTY output → terminal
    const removePtyData = window.electronAPI.onPtyData((incomingId, data) => {
      if (incomingId === ptyId) term.write(data);
    });

    const removePtyExit = window.electronAPI.onPtyExit((incomingId, code) => {
      if (incomingId === ptyId) {
        term.write(`\r\n[Process exited with code ${code}]\r\n`);
      }
    });

    // Resize observer
    const observer = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        window.electronAPI
          .ptyResize(ptyId, term.cols, term.rows)
          .catch(console.error);
      } catch {
        // FitAddon can throw if the terminal isn't visible
      }
    });
    observer.observe(container);

    return () => {
      removePtyData();
      removePtyExit();
      dataDisposable.dispose();
      observer.disconnect();
      window.electronAPI.ptyKill(ptyId).catch(console.error);
      term.dispose();
    };
  }, [ptyId, cwd]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ padding: "8px" }}
    />
  );
}
