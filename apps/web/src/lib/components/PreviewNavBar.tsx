"use client";

import { useState, useEffect, useRef, type RefObject } from "react";
import {
  Input,
  Spinner,
  WebPreviewNavigationButton,
} from "@eva/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconExternalLink,
  IconMaximize,
} from "@tabler/icons-react";
import { stripPreviewGrant, carryPreviewGrant } from "@/lib/utils/previewGrant";

function getPathFromUrl(fullUrl: string): string {
  try {
    const parsed = new URL(fullUrl);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/";
  }
}

export function normalizePreviewPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function buildUrlWithPath(baseUrl: string, path: string): string {
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    const fullPath = normalizePreviewPath(path);
    // Carry the preview grant onto the rebuilt URL so the iframe's first load
    // can establish the proxy session cookie instead of bouncing to sign-in.
    return carryPreviewGrant(baseUrl, `${parsed.origin}${fullPath}`);
  } catch {
    return baseUrl;
  }
}

/**
 * Reads the iframe's current location, or null when it is cross-origin.
 *
 * A module-level helper rather than an inline try/catch in the component: the
 * optional chaining has to sit outside the `try`, since React Compiler bails on
 * a whole file when expression-level control flow appears inside one.
 */
function readIframeHref(iframe: HTMLIFrameElement | null): string | null {
  const frameWindow = iframe?.contentWindow;
  if (!frameWindow) return null;
  try {
    return frameWindow.location.href;
  } catch {
    // cross-origin — cannot read iframe location
    return null;
  }
}

/**
 * Drives the iframe's own session history. Returns false when cross-origin
 * access is blocked, so the caller can fall back to a postMessage command.
 */
function stepIframeHistory(
  iframe: HTMLIFrameElement | null,
  direction: "back" | "forward",
): boolean {
  const frameWindow = iframe?.contentWindow;
  if (!frameWindow) return false;
  try {
    if (direction === "back") {
      frameWindow.history.back();
    } else {
      frameWindow.history.forward();
    }
    return true;
  } catch {
    return false;
  }
}

interface PreviewNavBarProps {
  previewUrl: string | null;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  port: number;
  path?: string;
  onPortChange?: (port: number) => void;
  defaultPath?: string;
  onPathChange?: (path: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

type PreviewHistoryCommand =
  | "eva-preview-history-back"
  | "eva-preview-history-forward";

export function PreviewNavBar({
  previewUrl,
  iframeRef,
  containerRef,
  port,
  path,
  onPortChange,
  defaultPath = "/",
  onPathChange,
  isLoading = false,
  onRefresh,
}: PreviewNavBarProps) {
  const [portInput, setPortInput] = useState(String(port));
  const [pathInput, setPathInput] = useState(path ?? defaultPath);
  // Tracks the last value emitted via onPathChange so the three event sources
  // (input commit, iframe load, in-iframe postMessage) don't fire redundant
  // notifications for the same path.
  const lastNotifiedPathRef = useRef<string | null>(null);

  // Adjust draft inputs during render when external port/path props change
  // (React-recommended alternative to setState-in-effect).
  const [prevPort, setPrevPort] = useState(port);
  if (port !== prevPort) {
    setPrevPort(port);
    setPortInput(String(port));
  }
  const resolvedPath = path ?? defaultPath;
  const [prevPath, setPrevPath] = useState(resolvedPath);
  if (resolvedPath !== prevPath) {
    setPrevPath(resolvedPath);
    setPathInput(resolvedPath);
  }

  function notifyPathChange(nextPath: string) {
    if (lastNotifiedPathRef.current === nextPath) return;
    lastNotifiedPathRef.current = nextPath;
    onPathChange?.(nextPath);
  }

  function syncPathFromIframe() {
    const href = readIframeHref(iframeRef.current);
    // Skip about:blank, data:, blob:, etc. — the iframe fires `load` for the
    // initial empty document before the real URL is applied, and we don't
    // want that captured as a navigable path.
    if (!href || !/^https?:/i.test(href)) return;
    const nextPath = getPathFromUrl(href);
    setPathInput(nextPath);
    notifyPathChange(nextPath);
  }

  // Latest-function refs for the long-lived iframe listeners below. Written in
  // an effect (not during render) so React Compiler can compile the file; the
  // listeners only fire after commit, so the effect-time write is equivalent.
  const syncPathFromIframeRef = useRef(syncPathFromIframe);
  const notifyPathChangeRef = useRef(notifyPathChange);
  useEffect(() => {
    syncPathFromIframeRef.current = syncPathFromIframe;
    notifyPathChangeRef.current = notifyPathChange;
  });

  function postHistoryCommand(type: PreviewHistoryCommand) {
    iframeRef.current?.contentWindow?.postMessage({ type }, "*");
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      syncPathFromIframeRef.current();
    };
    iframe.addEventListener("load", onLoad);

    function handleMessage(event: MessageEvent) {
      if (
        event.source === iframeRef.current?.contentWindow &&
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        event.data.type === "navigation" &&
        "url" in event.data &&
        typeof event.data.url === "string"
      ) {
        const nextPath = getPathFromUrl(event.data.url);
        setPathInput(nextPath);
        notifyPathChangeRef.current(nextPath);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [iframeRef]);

  function goBack() {
    const handled = stepIframeHistory(iframeRef.current, "back");
    if (!handled) {
      postHistoryCommand("eva-preview-history-back");
    }
    setTimeout(syncPathFromIframe, 200);
  }

  function goForward() {
    const handled = stepIframeHistory(iframeRef.current, "forward");
    if (!handled) {
      postHistoryCommand("eva-preview-history-forward");
    }
    setTimeout(syncPathFromIframe, 200);
  }

  function reload() {
    if (iframeRef.current) {
      // Reassigning the same src forces the iframe to reload its document.
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = currentSrc;
    }
  }

  function commitPath() {
    if (!iframeRef.current || !previewUrl) return;
    const nextPath = normalizePreviewPath(pathInput);
    setPathInput(nextPath);
    notifyPathChange(nextPath);
    iframeRef.current.src = buildUrlWithPath(previewUrl, nextPath);
  }

  function commitPort() {
    const parsed = parseInt(portInput, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      onPortChange?.(parsed);
    } else {
      setPortInput(String(port));
    }
  }

  // Strip the grant from the shareable "open in new tab" link: opening it is a
  // top-level navigation that runs the sign-in handshake, and the link must not
  // carry a bearer token.
  const openInNewTabHref = previewUrl
    ? stripPreviewGrant(buildUrlWithPath(previewUrl, pathInput))
    : undefined;

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  }

  function handleOpenInNewTab() {
    if (openInNewTabHref) {
      window.open(openInNewTabHref, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <>
      <WebPreviewNavigationButton tooltip="Back" onClick={goBack}>
        <IconArrowLeft className="w-3.5 h-3.5" />
      </WebPreviewNavigationButton>
      <WebPreviewNavigationButton tooltip="Forward" onClick={goForward}>
        <IconArrowRight className="w-3.5 h-3.5" />
      </WebPreviewNavigationButton>
      <WebPreviewNavigationButton
        tooltip="Reload"
        onClick={isLoading && onRefresh ? onRefresh : reload}
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <IconRefresh className="w-3.5 h-3.5" />
        )}
      </WebPreviewNavigationButton>
      <Input
        className="h-8 flex-1 text-xs"
        value={pathInput}
        onChange={(e) => setPathInput(e.target.value)}
        onBlur={commitPath}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitPath();
        }}
        placeholder="/"
        aria-label="Preview path"
      />
      <Input
        className="h-8 w-14 text-xs text-center px-1 sm:w-16"
        value={portInput}
        onChange={(e) => setPortInput(e.target.value)}
        onBlur={commitPort}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitPort();
        }}
        aria-label="Preview port"
      />
      <WebPreviewNavigationButton
        tooltip="Open in new tab"
        disabled={!previewUrl}
        onClick={handleOpenInNewTab}
      >
        <IconExternalLink className="w-3.5 h-3.5" />
      </WebPreviewNavigationButton>
      <WebPreviewNavigationButton
        tooltip="Fullscreen"
        onClick={toggleFullscreen}
      >
        <IconMaximize className="w-3.5 h-3.5" />
      </WebPreviewNavigationButton>
    </>
  );
}
