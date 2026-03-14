"use client";

import { useState, useEffect, useCallback, type RefObject } from "react";
import { Input, Spinner } from "@conductor/ui";
import { WebPreviewNavigationButton } from "@conductor/ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconExternalLink,
  IconMaximize,
} from "@tabler/icons-react";

function getPathFromUrl(fullUrl: string): string {
  try {
    const parsed = new URL(fullUrl);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/";
  }
}

function buildUrlWithPath(baseUrl: string, path: string): string {
  try {
    const parsed = new URL(baseUrl);
    parsed.pathname = path.startsWith("/") ? path : `/${path}`;
    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

interface PreviewNavBarProps {
  previewUrl: string | null;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  port: number;
  onPortChange?: (port: number) => void;
  defaultPath?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function PreviewNavBar({
  previewUrl,
  iframeRef,
  containerRef,
  port,
  onPortChange,
  defaultPath = "/",
  isLoading = false,
  onRefresh,
}: PreviewNavBarProps) {
  const [portInput, setPortInput] = useState(String(port));
  const [pathInput, setPathInput] = useState(defaultPath);
  const [prevPreviewUrl, setPrevPreviewUrl] = useState(previewUrl);

  if (previewUrl !== prevPreviewUrl) {
    setPrevPreviewUrl(previewUrl);
    setPathInput(getPathFromUrl(previewUrl ?? defaultPath));
  }

  const syncPathFromIframe = useCallback(() => {
    try {
      const href = iframeRef.current?.contentWindow?.location.href;
      if (href) {
        setPathInput(getPathFromUrl(href));
      }
    } catch {
      // cross-origin — cannot read iframe location
    }
  }, [iframeRef]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.addEventListener("load", syncPathFromIframe);
    return () => iframe.removeEventListener("load", syncPathFromIframe);
  }, [iframeRef, syncPathFromIframe]);

  function goBack() {
    try {
      iframeRef.current?.contentWindow?.history.back();
      setTimeout(syncPathFromIframe, 200);
    } catch {}
  }

  function goForward() {
    try {
      iframeRef.current?.contentWindow?.history.forward();
      setTimeout(syncPathFromIframe, 200);
    } catch {}
  }

  function reload() {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }

  function commitPath() {
    if (!iframeRef.current || !previewUrl) return;
    iframeRef.current.src = buildUrlWithPath(previewUrl, pathInput);
  }

  function commitPort() {
    const parsed = parseInt(portInput, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      onPortChange?.(parsed);
    } else {
      setPortInput(String(port));
    }
  }

  const openInNewTabHref = previewUrl
    ? buildUrlWithPath(previewUrl, pathInput)
    : undefined;

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
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
        asChild
      >
        <a href={openInNewTabHref} target="_blank" rel="noopener noreferrer">
          <IconExternalLink className="w-3.5 h-3.5" />
        </a>
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
