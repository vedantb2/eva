"use client";

import type { ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  LEFT_PANEL_ID,
  RIGHT_PANEL_ID,
  usePersistentPanelSize,
} from "@/lib/hooks/usePersistentPanelSize";

interface ResizableSidebarProps {
  /** Sidebar content, usually a file tree. */
  sidebar: ReactNode;
  /** The main content beside it. */
  children: ReactNode;
  /** localStorage namespace for the remembered width. */
  storageKey: string;
  /** Width used until the user drags. */
  defaultWidth?: string;
  minSidebarWidthPx?: number;
  minContentWidthPx?: number;
}

/**
 * A draggable sidebar whose width is remembered per device.
 *
 * Separate from `ResizablePanelLayout` because that one owns collapse
 * behaviour, a toggle button and a mobile stacked layout, none of which a file
 * tree needs. Both share their persistence through `usePersistentPanelSize`.
 */
export function ResizableSidebar({
  sidebar,
  children,
  storageKey,
  defaultWidth = "256px",
  minSidebarWidthPx = 160,
  minContentWidthPx = 320,
}: ResizableSidebarProps) {
  "use no memo";
  const { initialSize, onLayoutChanged } = usePersistentPanelSize({
    storageKey,
    panel: "left",
    defaultSize: defaultWidth,
  });

  return (
    <Group
      id={storageKey}
      orientation="horizontal"
      className="h-full min-h-0"
      onLayoutChanged={onLayoutChanged}
    >
      <Panel
        id={LEFT_PANEL_ID}
        defaultSize={initialSize}
        minSize={minSidebarWidthPx}
        className="flex min-h-0 flex-col"
      >
        {sidebar}
      </Panel>
      {/* Hairline divider that doubles as the drag handle; the library widens the
          pointer target beyond the visible pixel, so no grip affordance is needed.
          The grab colour is exempt from the transition so it lands on
          pointer-down rather than fading in behind the drag. */}
      <Separator className="w-px shrink-0 bg-border transition-colors hover:bg-primary/50 data-resize-handle-active:bg-primary data-resize-handle-active:transition-none" />
      <Panel
        id={RIGHT_PANEL_ID}
        minSize={minContentWidthPx}
        className="flex min-h-0 flex-col"
      >
        {children}
      </Panel>
    </Group>
  );
}
