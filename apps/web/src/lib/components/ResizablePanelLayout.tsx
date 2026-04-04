"use client";

import { type ReactNode, useCallback, useRef } from "react";
import {
  Group,
  Panel,
  type PanelSize,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import { IconGripVertical } from "@tabler/icons-react";
import { useLocalStorage } from "usehooks-ts";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

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
  storageKey: string;
}

const DEFAULT_RIGHT_PANEL_SIZE = "60%";

export function ResizablePanelLayout({
  leftPanel,
  rightPanel,
  leftDefaultSize,
  leftMinWidthPx,
  rightMinWidthPx,
  storageKey,
}: ResizablePanelLayoutProps) {
  const rightPanelRef = usePanelRef();
  const [rightCollapsed, setRightCollapsed] = useLocalStorage(storageKey, true);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const lastExpandedSize = useRef<string>(DEFAULT_RIGHT_PANEL_SIZE);

  const handleToggle = () => {
    if (rightCollapsed) {
      rightPanelRef.current?.resize(lastExpandedSize.current);
    } else {
      rightPanelRef.current?.collapse();
    }
  };

  const handleResize = useCallback(
    (size: PanelSize) => {
      const collapsed = size.asPercentage === 0;
      if (!collapsed) {
        lastExpandedSize.current = `${size.asPercentage}%`;
      }
      setRightCollapsed(collapsed);
    },
    [setRightCollapsed],
  );

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
        defaultSize={rightCollapsed ? 0 : DEFAULT_RIGHT_PANEL_SIZE}
        minSize={rightMinWidthPx}
        panelRef={rightPanelRef}
        onResize={handleResize}
      >
        {rightPanel}
      </Panel>
    </Group>
  );
}
