import { useEffect, useRef, useState } from "react";
import type { Layout } from "react-resizable-panels";
import { useLocalStorage } from "usehooks-ts";

/**
 * Panel ids for a two-panel `Group`. A group's `Layout` is keyed by panel id, so
 * the ids have to be stable across mounts — the library's `useId` fallback is
 * not, which would make a saved layout unreadable next mount.
 */
export const LEFT_PANEL_ID = "left";
export const RIGHT_PANEL_ID = "right";

interface PersistentPanelSizeOptions {
  /** localStorage namespace. The size is stored under `${storageKey}:size`. */
  storageKey: string;
  /** Which of the two panels the stored size describes. */
  panel: "left" | "right";
  /** Size used until the user drags, e.g. `"60%"` or `"256px"`. */
  defaultSize: string;
}

interface PersistentPanelSize {
  /**
   * Pass to the persisted panel's `defaultSize`. Frozen at mount, since the
   * group only reads it once and changing it later would fight the live layout.
   */
  initialSize: string;
  /**
   * The latest stored size, for callers that resize imperatively — expanding a
   * collapsed panel back to the width the user chose, for instance.
   */
  savedSize: string;
  /** Pass to the `Group`'s `onLayoutChanged`. */
  onLayoutChanged: (layout: Layout) => void;
}

/**
 * Remembers where the user dragged a two-panel `Group`'s handle.
 *
 * localStorage rather than Convex: the split that feels right depends on the
 * window in front of you, so syncing it between devices would be wrong, and a
 * drag should not cost a server write.
 *
 * Reads the group's `onLayoutChanged` rather than a panel's `onResize` because
 * the latter fires on every pointer move, which would be a write per frame of
 * the drag. This one fires once, after the pointer is released.
 */
export function usePersistentPanelSize({
  storageKey,
  panel,
  defaultSize,
}: PersistentPanelSizeOptions): PersistentPanelSize {
  const [savedSize, setSavedSize] = useLocalStorage(
    `${storageKey}:size`,
    defaultSize,
  );
  const [initialSize] = useState(savedSize);
  // Guards the first layout report; see `onLayoutChanged` below.
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
  }, []);

  const onLayoutChanged = (layout: Layout) => {
    // The group reports its starting layout from a layout effect, and effects
    // run child-first — so it fires before this component's own effects, while
    // `useLocalStorage`'s setter is still a stub that throws. Nothing is lost by
    // skipping it: that first report only echoes back `initialSize`.
    if (!isMounted.current) return;
    const percentage = panelPercentage(layout, panel);
    // Null when a panel is missing; 0 when collapsed — collapsed state is
    // tracked separately, and 0 is not a width worth returning to.
    if (percentage === null || percentage === 0) return;
    setSavedSize(`${percentage}%`);
  };

  return { initialSize, savedSize, onLayoutChanged };
}

/**
 * A panel's share of its group, as a percentage. Derived from the ratio between
 * the two flexGrow values rather than read straight off one of them, so it holds
 * whatever scale the library normalises them to.
 */
export function panelPercentage(
  layout: Layout,
  panel: "left" | "right",
): number | null {
  const left = layout[LEFT_PANEL_ID];
  const right = layout[RIGHT_PANEL_ID];
  if (left === undefined || right === undefined) return null;
  const total = left + right;
  if (total <= 0) return null;
  return ((panel === "left" ? left : right) / total) * 100;
}
