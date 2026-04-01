"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { IconGripVertical } from "@tabler/icons-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

const ONE_YEAR = 60 * 60 * 24 * 365;

function readCollapsed(cookieName: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${cookieName}=true`);
}

function writeCollapsed(cookieName: string, collapsed: boolean) {
  document.cookie = `${cookieName}=${collapsed}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

interface PanelContext {
  rightPanelCollapsed: boolean;
  onToggleRightPanel: () => void;
}

interface ResizablePanelLayoutProps {
  leftPanel: (ctx: PanelContext) => ReactNode;
  rightPanel: ReactNode;
  leftDefaultSize: string;
  leftMinWidthPx: number;
  rightMinWidthPx: number;
  collapseCookieName: string;
}

export function ResizablePanelLayout({
  leftPanel,
  rightPanel,
  leftDefaultSize,
  leftMinWidthPx,
  rightMinWidthPx,
  collapseCookieName,
}: ResizablePanelLayoutProps) {
  const rightPanelRef = usePanelRef();
  const [rightCollapsed, setRightCollapsed] = useState(() =>
    readCollapsed(collapseCookieName),
  );
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (rightCollapsed) {
      rightPanelRef.current?.collapse();
    }
  }, [rightCollapsed, rightPanelRef]);

  const handleToggle = () => {
    const next = !rightCollapsed;
    if (next) {
      rightPanelRef.current?.collapse();
    } else {
      rightPanelRef.current?.expand();
    }
    setRightCollapsed(next);
    writeCollapsed(collapseCookieName, next);
  };

  const ctx: PanelContext = {
    rightPanelCollapsed: rightCollapsed,
    onToggleRightPanel: handleToggle,
  };

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <div className={rightCollapsed ? "flex-1 min-h-0" : "h-1/2 min-h-0"}>
          {leftPanel(ctx)}
        </div>
        {!rightCollapsed && (
          <>
            <div className="h-px bg-border shrink-0" />
            <div className="h-1/2 min-h-0">{rightPanel}</div>
          </>
        )}
      </div>
    );
  }

  return (
    <Group orientation="horizontal" className="h-full">
      <Panel defaultSize={leftDefaultSize} minSize={leftMinWidthPx}>
        {leftPanel(ctx)}
      </Panel>
      <Separator
        className={`w-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors ${rightCollapsed ? "hidden" : ""}`}
      >
        <div className="flex items-center justify-center w-3 h-full -mx-1.5 relative z-10">
          <IconGripVertical className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </Separator>
      <Panel
        collapsible
        collapsedSize={0}
        defaultSize="60%"
        minSize={rightMinWidthPx}
        panelRef={rightPanelRef}
      >
        {rightPanel}
      </Panel>
    </Group>
  );
}
