"use client";

import { useState, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  MobilePaneSwitcher,
  type MobilePaneLabels,
} from "@/lib/components/MobilePaneSwitcher";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
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
  /** Labels for the below-`md` pane switcher. */
  mobilePaneLabels?: MobilePaneLabels;
  /**
   * Bump this value to show the content pane on a phone — call sites do it when
   * the sidebar selection changes, so tapping a file in the tree shows the file
   * instead of appearing to do nothing. Only ever reveals content, never the
   * sidebar, and is inert on desktop where both panes are already on screen.
   */
  showContentSignal?: number;
}

const DEFAULT_MOBILE_PANE_LABELS: MobilePaneLabels = {
  left: "Files",
  right: "Content",
};

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
  mobilePaneLabels = DEFAULT_MOBILE_PANE_LABELS,
  showContentSignal,
}: ResizableSidebarProps) {
  "use no memo";
  const { initialSize, onLayoutChanged } = usePersistentPanelSize({
    storageKey,
    panel: "left",
    defaultSize: defaultWidth,
  });
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showSidebar, setShowSidebar] = useState(true);

  // Adjust-state-during-render rather than an effect: the only work is setting
  // React state, and the desktop path has nothing to do because both panes are
  // already visible there.
  const [prevContentSignal, setPrevContentSignal] = useState(showContentSignal);
  if (showContentSignal !== prevContentSignal) {
    setPrevContentSignal(showContentSignal);
    if (isMobile && showContentSignal !== undefined) setShowSidebar(false);
  }

  // The two px minimums add up to a 481px floor, which would scroll a phone
  // page sideways. Below `md` this collapses to one pane at a time, the same
  // contract as `ResizablePanelLayout`. Both panes stay mounted (`hidden`, not
  // unmounted) so switching does not reload the tree or lose viewer state.
  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MobilePaneSwitcher
          labels={mobilePaneLabels}
          showingRight={!showSidebar}
          onSelect={(pane) => setShowSidebar(pane === "left")}
        />
        <div
          className={showSidebar ? "flex min-h-0 flex-1 flex-col" : "hidden"}
        >
          {sidebar}
        </div>
        <div
          className={showSidebar ? "hidden" : "flex min-h-0 flex-1 flex-col"}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    // No `id` — see `ResizablePanelLayout`. Two kept-alive session shells both
    // render a file tree, and a shared group id makes the library resolve both
    // to whichever mounted first.
    <Group
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
