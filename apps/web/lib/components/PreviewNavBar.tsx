"use client";

import { useState, type ReactNode, type RefObject } from "react";
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
  leading?: ReactNode;
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
  leading,
}: PreviewNavBarProps) {
  const [portInput, setPortInput] = useState(String(port));
  const [pathInput, setPathInput] = useState(defaultPath);
  const [prevPreviewUrl, setPrevPreviewUrl] = useState(previewUrl);

  if (previewUrl !== prevPreviewUrl) {
    setPrevPreviewUrl(previewUrl);
    setPathInput(getPathFromUrl(previewUrl ?? defaultPath));
  }

  function goBack() {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch {}
  }

  function goForward() {
    try {
      iframeRef.current?.contentWindow?.history.forward();
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

  function openInNewTab() {
    if (iframeRef.current?.src) {
      window.open(iframeRef.current.src, "_blank");
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  }

  return (
    <>
      {leading}
      <div className="ml-auto" />
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
        className="h-8 flex-1 text-xs max-w-64"
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
        className="h-8 w-16 text-xs text-center px-1"
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
        onClick={openInNewTab}
        disabled={!previewUrl}
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
