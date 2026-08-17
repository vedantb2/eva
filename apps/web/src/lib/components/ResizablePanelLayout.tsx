"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useShortcut } from "@/lib/hotkeys/useShortcut";
import {
  Group,
  Panel,
  type PanelSize,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import { IconGripVertical } from "@tabler/icons-react";
import { AnimatePresence, m } from "motion/react";
import { useLocalStorage } from "usehooks-ts";
import {
  MobilePaneSwitcher,
  type MobilePaneLabels,
} from "@/lib/components/MobilePaneSwitcher";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import {
  LEFT_PANEL_ID,
  RIGHT_PANEL_ID,
  complementaryPercentage,
  usePersistentPanelSize,
} from "@/lib/hooks/usePersistentPanelSize";

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
  /** Initial collapsed state of the right panel when there is no stored value. Defaults to true. */
  defaultRightCollapsed?: boolean;
  /**
   * Bump this value to force-expand the right panel (e.g. agent browser lock).
   * Only expands; never collapses.
   */
  expandRightSignal?: number;
  /**
   * Bump this value to send a phone back to the left pane (e.g. the selection
   * the right pane was showing has been cleared). Mobile only: on desktop both
   * panes are on screen, so an empty right pane is a normal state rather than a
   * dead end, and collapsing it would fight the user's dragged width.
   */
  collapseRightSignal?: number;
  /**
   * Labels for the below-`md` pane switcher. Defaults are generic because the
   * switcher is the only way back to the left pane on a phone — call sites that
   * can name their panes ("Chat"/"Sandbox") should.
   */
  mobilePaneLabels?: MobilePaneLabels;
}

const DEFAULT_RIGHT_PANEL_SIZE = "60%";
const MOBILE_PANEL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DEFAULT_MOBILE_PANE_LABELS: MobilePaneLabels = {
  left: "List",
  right: "Details",
};

export function ResizablePanelLayout({
  leftPanel,
  rightPanel,
  leftDefaultSize,
  leftMinWidthPx,
  rightMinWidthPx,
  storageKey,
  defaultRightCollapsed = true,
  expandRightSignal,
  collapseRightSignal,
  mobilePaneLabels = DEFAULT_MOBILE_PANE_LABELS,
}: ResizablePanelLayoutProps) {
  "use no memo";
  const rightPanelRef = usePanelRef();
  const [savedCollapsed, setSavedCollapsed] = useLocalStorage(
    storageKey,
    defaultRightCollapsed,
  );
  const defaultRightSize = complementaryPercentage(
    leftDefaultSize,
    DEFAULT_RIGHT_PANEL_SIZE,
  );
  // Where the user last dragged the handle.
  const {
    initialSize: initialRightSize,
    savedSize: savedRightSize,
    onLayoutChanged,
  } = usePersistentPanelSize({
    storageKey,
    panel: "right",
    defaultSize: defaultRightSize,
  });
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Below `md` only one pane is on screen, so the layout always opens on the
  // left pane (chat / list) regardless of `defaultRightCollapsed` or the stored
  // desktop preference — the right pane's own "back" control lives in the left
  // pane at every call site, so opening on the right would trap the user.
  const [rightCollapsed, setRightCollapsed] = useState(() =>
    isMobile ? true : savedCollapsed,
  );
  // Seeded from storage so expanding after a reload returns to the dragged
  // width instead of the layout default.
  const lastExpandedSize = useRef<string>(savedRightSize);
  // Captured once for defaultSize — the stored flag does not change after mount
  const [initialCollapsed] = useState(savedCollapsed);
  const rightDefaultSize = initialCollapsed ? "0%" : initialRightSize;
  const restoredLeftSize = initialCollapsed
    ? "100%"
    : complementaryPercentage(initialRightSize, leftDefaultSize);

  // Adjust-state-during-render rather than an effect: the only work is setting
  // React state, and it is mobile-only, so there is nothing imperative to do to
  // the Panel ref on the desktop path.
  const [prevCollapseSignal, setPrevCollapseSignal] =
    useState(collapseRightSignal);
  if (collapseRightSignal !== prevCollapseSignal) {
    setPrevCollapseSignal(collapseRightSignal);
    if (isMobile && collapseRightSignal !== undefined) setRightCollapsed(true);
  }

  const handleToggle = useCallback(() => {
    // Mobile layout has no Panel ref — toggle local state directly. It is not
    // persisted: which pane you were last looking at on a phone must not
    // overwrite the dragged/collapsed desktop preference under the same key.
    if (isMobile) {
      setRightCollapsed((prev) => !prev);
      return;
    }
    if (rightCollapsed) {
      rightPanelRef.current?.resize(lastExpandedSize.current);
    } else {
      rightPanelRef.current?.collapse();
    }
  }, [isMobile, rightCollapsed, rightPanelRef]);

  useShortcut("toggleSandboxPanel", (e) => {
    e.preventDefault();
    handleToggle();
  });

  useEffect(() => {
    if (expandRightSignal === undefined || expandRightSignal === 0) return;
    if (isMobile) {
      setRightCollapsed(false);
      return;
    }
    rightPanelRef.current?.resize(lastExpandedSize.current);
  }, [expandRightSignal, isMobile, rightPanelRef]);

  const handleResize = (size: PanelSize) => {
    const collapsed = size.asPercentage === 0;
    if (!collapsed) {
      lastExpandedSize.current = `${size.asPercentage}%`;
    }
    setRightCollapsed(collapsed);
    setSavedCollapsed(collapsed);
  };

  const ctx: PanelContext = {
    rightPanelCollapsed: rightCollapsed,
    onToggleRightPanel: handleToggle,
  };

  if (isMobile) {
    const panelTransition = { duration: 0.22, ease: MOBILE_PANEL_EASE };
    const panelEnter = { opacity: 0, y: "8%" };
    const panelRest = { opacity: 1, y: "0%" };
    const panelExit = { opacity: 0, y: "8%" };

    // One pane at a time: the visible pane owns the full height. The switcher is
    // always present because the call sites' own toggle lives inside the left
    // pane, which is hidden while the right pane is showing.
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MobilePaneSwitcher
          labels={mobilePaneLabels}
          showingRight={!rightCollapsed}
          onSelect={(pane) => {
            if (pane === "left" ? !rightCollapsed : rightCollapsed) {
              handleToggle();
            }
          }}
        />
        {/* The right pane is an absolute overlay rather than a flex sibling so
            that its exit animation cannot momentarily split the height with the
            reappearing left pane. */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            className={
              rightCollapsed ? "flex min-h-0 flex-1 flex-col" : "hidden"
            }
          >
            {leftPanel(ctx)}
          </div>
          <AnimatePresence initial={false}>
            {!rightCollapsed ? (
              <m.div
                key="mobile-right-panel"
                className="absolute inset-0 z-10 flex min-h-0 flex-col bg-background"
                initial={panelEnter}
                animate={panelRest}
                exit={panelExit}
                transition={panelTransition}
              >
                {rightPanel}
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <Group
      id={storageKey}
      orientation="horizontal"
      className="h-full"
      onLayoutChanged={onLayoutChanged}
    >
      <Panel
        id={LEFT_PANEL_ID}
        defaultSize={restoredLeftSize}
        minSize={leftMinWidthPx}
      >
        {leftPanel(ctx)}
      </Panel>
      {/* The grab colour skips the transition so it lands on pointer-down
          instead of fading in 150ms behind the drag. */}
      <Separator
        className={`w-px bg-border transition-colors hover:bg-primary/50 data-resize-handle-active:bg-primary data-resize-handle-active:transition-none ${rightCollapsed ? "hidden" : ""}`}
      >
        <div className="flex items-center justify-center w-3 h-full -mx-1.5 relative z-10">
          <IconGripVertical className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </Separator>
      <Panel
        id={RIGHT_PANEL_ID}
        collapsible
        collapsedSize={0}
        defaultSize={rightDefaultSize}
        minSize={rightMinWidthPx}
        panelRef={rightPanelRef}
        onResize={handleResize}
      >
        {rightPanel}
      </Panel>
    </Group>
  );
}
