"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefCallback,
} from "react";
import { useSessionStorage } from "usehooks-ts";

const STORAGE_PREFIX = "eva:list-scroll:";

/** Re-apply after Virtuoso measures; first paint often resets scrollTop. */
function applyScrollTop(el: HTMLElement, scrollTop: number): void {
  el.scrollTop = scrollTop;
  requestAnimationFrame(() => {
    el.scrollTop = scrollTop;
    requestAnimationFrame(() => {
      el.scrollTop = scrollTop;
    });
  });
}

/**
 * Write under an explicit key (JSON, same as useSessionStorage).
 * Avoids setState-on-scroll re-renders and the useEventCallback key-change
 * pitfall if cleanup called the hook setter after `storageKey` switched.
 */
function writeScrollTop(fullKey: string, scrollTop: number): void {
  try {
    sessionStorage.setItem(fullKey, JSON.stringify(Math.round(scrollTop)));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/**
 * Container scroll ref that restores `scrollTop` from useSessionStorage (per tab).
 * Survives list unmount when opening a detail route; cleared when the tab closes.
 */
export function usePersistedScrollParent(storageKey: string): {
  scrollParent: HTMLDivElement | null;
  scrollRef: RefCallback<HTMLDivElement>;
} {
  const fullKey = STORAGE_PREFIX + storageKey;
  const [savedScrollTop] = useSessionStorage(fullKey, 0);
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef(savedScrollTop);
  savedScrollTopRef.current = savedScrollTop;

  useLayoutEffect(() => {
    if (!scrollParent) return;

    const initial = savedScrollTopRef.current;
    if (initial > 0) {
      applyScrollTop(scrollParent, initial);
    }

    let rafId = 0;
    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        writeScrollTop(fullKey, scrollParent.scrollTop);
      });
    };

    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
      }
      writeScrollTop(fullKey, scrollParent.scrollTop);
      scrollParent.removeEventListener("scroll", onScroll);
    };
  }, [scrollParent, fullKey]);

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    setScrollParent(node);
  }, []);

  return { scrollParent, scrollRef };
}
