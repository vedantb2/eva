import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { WebglAddon } from "@xterm/addon-webgl";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
  ptyId: string;
  visible: boolean;
}

export function TerminalView({ ptyId, visible }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      scrollback: 5000,
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

    try {
      term.loadAddon(new WebglAddon());
    } catch {
      // WebGL context failed — xterm falls back to canvas automatically
    }

    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const dataDisposable = term.onData((data) => {
      window.electronAPI.ptyInput(ptyId, data);
    });

    const removePtyData = window.electronAPI.onPtyData(ptyId, (data) => {
      term.write(data);
    });

    const removePtyExit = window.electronAPI.onPtyExit(ptyId, (code) => {
      term.write(`\r\n[Process exited with code ${code}]\r\n`);
    });

    let resizeRaf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        try {
          fitAddon.fit();
          window.electronAPI
            .ptyResize(ptyId, term.cols, term.rows)
            .catch(() => {});
        } catch {
          // FitAddon can throw if the terminal isn't visible
        }
      });
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(resizeRaf);
      removePtyData();
      removePtyExit();
      dataDisposable.dispose();
      observer.disconnect();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [ptyId]);

  useEffect(() => {
    if (visible && fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
      } catch {
        // ignore
      }
    }
  }, [visible]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{
        padding: "8px",
        display: visible ? "block" : "none",
      }}
    />
  );
}
