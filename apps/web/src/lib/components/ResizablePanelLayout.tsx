import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Group,
  Panel,
  type PanelSize,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import { IconGripVertical } from "@tabler/icons-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useLocalStorage } from "usehooks-ts";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import {
  LEFT_PANEL_ID,
  RIGHT_PANEL_ID,
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
}

const DEFAULT_RIGHT_PANEL_SIZE = "60%";
const MOBILE_PANEL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ResizablePanelLayout({
  leftPanel,
  rightPanel,
  leftDefaultSize,
  leftMinWidthPx,
  rightMinWidthPx,
  storageKey,
  defaultRightCollapsed = true,
  expandRightSignal,
}: ResizablePanelLayoutProps) {
  "use no memo";
  const rightPanelRef = usePanelRef();
  const [savedCollapsed, setSavedCollapsed] = useLocalStorage(
    storageKey,
    defaultRightCollapsed,
  );
  // Where the user last dragged the handle.
  const {
    initialSize: initialRightSize,
    savedSize: savedRightSize,
    onLayoutChanged,
  } = usePersistentPanelSize({
    storageKey,
    panel: "right",
    defaultSize: DEFAULT_RIGHT_PANEL_SIZE,
  });
  const [rightCollapsed, setRightCollapsed] = useState(savedCollapsed);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduceMotion = useReducedMotion();
  // Seeded from storage so expanding after a reload returns to the dragged
  // width instead of the 60% default.
  const lastExpandedSize = useRef<string>(savedRightSize);
  // Captured once for defaultSize — the stored flag does not change after mount
  const [initialCollapsed] = useState(savedCollapsed);

  const handleToggle = useCallback(() => {
    // Mobile layout has no Panel ref — toggle local state directly.
    if (isMobile) {
      setRightCollapsed((prev) => {
        const next = !prev;
        setSavedCollapsed(next);
        return next;
      });
      return;
    }
    if (rightCollapsed) {
      rightPanelRef.current?.resize(lastExpandedSize.current);
    } else {
      rightPanelRef.current?.collapse();
    }
  }, [isMobile, rightCollapsed, rightPanelRef, setSavedCollapsed]);

  useEffect(() => {
    if (expandRightSignal === undefined || expandRightSignal === 0) return;
    if (isMobile) {
      setRightCollapsed(false);
      setSavedCollapsed(false);
      return;
    }
    rightPanelRef.current?.resize(lastExpandedSize.current);
  }, [expandRightSignal, isMobile, rightPanelRef, setSavedCollapsed]);

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
    const panelTransition = reduceMotion
      ? { duration: 0.15 }
      : { duration: 0.22, ease: MOBILE_PANEL_EASE };
    const panelEnter = reduceMotion ? { opacity: 0 } : { opacity: 0, y: "8%" };
    const panelRest = reduceMotion ? { opacity: 1 } : { opacity: 1, y: "0%" };
    const panelExit = reduceMotion ? { opacity: 0 } : { opacity: 0, y: "8%" };

    return (
      <div className="flex h-full flex-col">
        <div className={rightCollapsed ? "flex-1 min-h-0" : "h-1/2 min-h-0"}>
          {leftPanel(ctx)}
        </div>
        <AnimatePresence initial={false}>
          {!rightCollapsed ? (
            <m.div
              key="mobile-right-panel"
              className="flex h-1/2 min-h-0 flex-col"
              initial={panelEnter}
              animate={panelRest}
              exit={panelExit}
              transition={panelTransition}
            >
              <div className="h-px shrink-0 bg-border" />
              <div className="min-h-0 flex-1">{rightPanel}</div>
            </m.div>
          ) : null}
        </AnimatePresence>
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
        defaultSize={leftDefaultSize}
        minSize={leftMinWidthPx}
      >
        {leftPanel(ctx)}
      </Panel>
      <Separator
        className={`w-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors ${rightCollapsed ? "hidden" : ""}`}
      >
        <div className="flex items-center justify-center w-3 h-full -mx-1.5 relative z-10">
          <IconGripVertical className="w-4 h-4 text-subtle-foreground" />
        </div>
      </Separator>
      <Panel
        id={RIGHT_PANEL_ID}
        collapsible
        collapsedSize={0}
        defaultSize={initialCollapsed ? 0 : initialRightSize}
        minSize={rightMinWidthPx}
        panelRef={rightPanelRef}
        onResize={handleResize}
      >
        {rightPanel}
      </Panel>
    </Group>
  );
}
