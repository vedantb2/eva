"use client";

import { useSyncExternalStore } from "react";
import { cn, useWebPreview } from "@eva/ui";

/**
 * Global preview-iframe keep-alive.
 *
 * Preview iframes are the one thing React unmounting destroys irrecoverably:
 * detaching an iframe from the DOM discards its document, so any remount
 * reloads the app under development. Route changes (/home, cross-app cold
 * switches) unmount the session tree no matter how it is cached, so the
 * iframes live OUTSIDE the router instead — in {@link PreviewIframeHost},
 * mounted once at the app root. Panels render a measured placeholder
 * ({@link PersistentPreviewBody}); the host overlays the real iframe on the
 * placeholder's rect. The iframe element never moves in the DOM (moving also
 * reloads it) — it only repositions, and hides via `display: none` (which
 * keeps the document alive) while its placeholder is hidden or unmounted.
 */

interface PreviewInfo {
  url: string;
  port: number;
}

/**
 * Per sandbox:port resolution state, kept so a remounting useSandboxPreview
 * can seed itself and skip the loading overlay + iframe remount entirely.
 */
export interface PreviewMeta {
  previewInfo: PreviewInfo;
  strippedTarget: string;
  epoch: number;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface LogicalSize {
  width: number;
  height: number;
}

interface HostEntry {
  /** Placeholder identity (pathStorageKey) — stable across remounts. */
  key: string;
  /** `${sandboxId}:${port}` — evicted together when the sandbox stops. */
  group: string;
  src: string;
  /** Bump = deliberate reload; the host remounts the iframe on change. */
  epoch: number;
  anchor: HTMLElement | null;
  rect: Rect | null;
  element: HTMLIFrameElement | null;
  /** Guest CSS viewport; null = fill the placeholder. */
  logical: LogicalSize | null;
  /** Device emulation active — host wrapper draws the device edge borders. */
  bordered: boolean;
  attachedAt: number;
}

/** Hidden iframes keep running dev apps (HMR sockets, timers) — cap RAM. */
const MAX_IFRAMES = 3;

const entries = new Map<string, HostEntry>();
const metaByGroup = new Map<string, PreviewMeta>();
const onElementByKey = new Map<
  string,
  (el: HTMLIFrameElement | null) => void
>();
const listeners = new Set<() => void>();
let snapshot: ReadonlyArray<HostEntry> = [];

function notify(): void {
  snapshot = Array.from(entries.values());
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ReadonlyArray<HostEntry> {
  return snapshot;
}

function measure(anchor: HTMLElement): Rect {
  const rect = anchor.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  );
}

/** Re-reads every anchored placeholder's rect; notifies only on change. */
function remeasureAll(): void {
  let changed = false;
  for (const [key, entry] of entries) {
    if (entry.anchor === null) continue;
    const rect = measure(entry.anchor);
    if (!sameRect(rect, entry.rect)) {
      entries.set(key, { ...entry, rect });
      changed = true;
    }
  }
  if (changed) notify();
}

/**
 * Window-level layout listeners exist only while at least one placeholder is
 * attached. Scroll uses capture so scrolling inside any container repositions
 * the overlay, not just document scrolls.
 */
let layoutListenerCount = 0;
function acquireLayoutListeners(): void {
  layoutListenerCount += 1;
  if (layoutListenerCount > 1) return;
  window.addEventListener("resize", remeasureAll);
  window.addEventListener("scroll", remeasureAll, true);
  document.addEventListener("fullscreenchange", remeasureAll);
}
function releaseLayoutListeners(): void {
  layoutListenerCount -= 1;
  if (layoutListenerCount > 0) return;
  window.removeEventListener("resize", remeasureAll);
  window.removeEventListener("scroll", remeasureAll, true);
  document.removeEventListener("fullscreenchange", remeasureAll);
}

function evictOverCap(): void {
  if (entries.size <= MAX_IFRAMES) return;
  let oldest: HostEntry | null = null;
  for (const entry of entries.values()) {
    // Anchored = a mounted panel is showing it; never evict those.
    if (entry.anchor !== null) continue;
    if (oldest === null || entry.attachedAt < oldest.attachedAt) {
      oldest = entry;
    }
  }
  if (oldest !== null) {
    entries.delete(oldest.key);
  }
}

interface AttachOptions {
  anchor: HTMLElement;
  group: string;
  /** Undefined = nothing to show (loading/error) — hides any cached iframe. */
  src: string | undefined;
  epoch: number;
  logical: LogicalSize | null;
  /** Receives the live iframe element (panels wire it into iframeRef). */
  onElement: (el: HTMLIFrameElement | null) => void;
}

/**
 * Claims the host slot for `key` while the placeholder is mounted. Returns
 * the detach cleanup: the iframe is hidden but kept cached for the next visit.
 */
function attach(key: string, options: AttachOptions): (() => void) | undefined {
  const existing = entries.get(key);

  if (options.src === undefined) {
    // Loading or error state — the panel is showing an overlay there instead.
    if (existing !== undefined) {
      entries.set(key, { ...existing, anchor: null, rect: null });
      notify();
    }
    return undefined;
  }

  const sameEpoch = existing !== undefined && existing.epoch === options.epoch;
  entries.set(key, {
    key,
    group: options.group,
    // Same epoch = the cached document must be kept; a revalidated src for
    // the same target carries a fresh grant and would reload it.
    src: sameEpoch ? existing.src : options.src,
    epoch: options.epoch,
    anchor: options.anchor,
    rect: measure(options.anchor),
    element: sameEpoch ? existing.element : null,
    logical: options.logical,
    bordered: options.logical !== null,
    attachedAt: Date.now(),
  });
  evictOverCap();

  onElementByKey.set(key, options.onElement);
  const current = entries.get(key);
  options.onElement(current?.element ?? null);

  const observer = new ResizeObserver(() => {
    const entry = entries.get(key);
    if (entry === undefined || entry.anchor === null) return;
    const rect = measure(entry.anchor);
    if (sameRect(rect, entry.rect)) return;
    entries.set(key, { ...entry, rect });
    notify();
  });
  observer.observe(options.anchor);
  acquireLayoutListeners();
  notify();

  return () => {
    observer.disconnect();
    releaseLayoutListeners();
    if (onElementByKey.get(key) === options.onElement) {
      onElementByKey.delete(key);
    }
    options.onElement(null);
    const entry = entries.get(key);
    if (entry !== undefined && entry.anchor === options.anchor) {
      entries.set(key, { ...entry, anchor: null, rect: null });
      notify();
    }
  };
}

/**
 * Stable per-key iframe ref callbacks. Inline closures would change identity
 * every host render, making React detach/re-run them and ping-pong `notify`
 * into an infinite render loop.
 */
const iframeRefByKey = new Map<
  string,
  (el: HTMLIFrameElement | null) => void
>();
function iframeRefFor(key: string): (el: HTMLIFrameElement | null) => void {
  const cached = iframeRefByKey.get(key);
  if (cached !== undefined) return cached;
  const callback = (el: HTMLIFrameElement | null) => {
    const entry = entries.get(key);
    if (entry === undefined || entry.element === el) return;
    entries.set(key, { ...entry, element: el });
    onElementByKey.get(key)?.(el);
    notify();
  };
  iframeRefByKey.set(key, callback);
  return callback;
}

export function getPreviewMeta(group: string): PreviewMeta | undefined {
  return metaByGroup.get(group);
}

export function setPreviewMeta(group: string, meta: PreviewMeta): void {
  metaByGroup.set(group, meta);
}

/** Sandbox stopped: every port's cached documents are dead weight — free them. */
export function dropPreviewGroup(sandboxId: string): void {
  const prefix = `${sandboxId}:`;
  for (const key of Array.from(metaByGroup.keys())) {
    if (key.startsWith(prefix)) {
      metaByGroup.delete(key);
    }
  }
  let changed = false;
  for (const [key, entry] of entries) {
    if (entry.group === sandboxId || entry.group.startsWith(prefix)) {
      entries.delete(key);
      changed = true;
    }
  }
  if (changed) notify();
}

/** Live iframe element for a placeholder key (null until the host mounts it). */
export function usePreviewIframeElement(key: string): HTMLIFrameElement | null {
  return useSyncExternalStore(
    subscribe,
    () => entries.get(key)?.element ?? null,
  );
}

function subscribeFullscreen(listener: () => void): () => void {
  document.addEventListener("fullscreenchange", listener);
  return () => document.removeEventListener("fullscreenchange", listener);
}

export function useFullscreenElement(): Element | null {
  return useSyncExternalStore(
    subscribeFullscreen,
    () => document.fullscreenElement,
  );
}

/**
 * The root-mounted overlay that owns every preview iframe. z-40 keeps the
 * iframes above routed content (their rect never covers anything but the
 * placeholder) while Radix portals (z-50) still stack above them.
 */
export function PreviewIframeHost() {
  const hosted = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {hosted.map((entry) => {
        const visible =
          entry.rect !== null &&
          entry.rect.width > 0 &&
          entry.rect.height > 0;
        const logical = entry.logical;
        const scale =
          logical && entry.rect
            ? Math.min(
                entry.rect.width / logical.width,
                entry.rect.height / logical.height,
              )
            : 1;
        return (
          <div
            key={entry.key}
            className={cn(
              "pointer-events-auto absolute overflow-hidden bg-background",
              entry.bordered && "border border-border",
              !visible && "hidden",
            )}
            style={
              visible && entry.rect !== null
                ? {
                    top: entry.rect.top,
                    left: entry.rect.left,
                    width: entry.rect.width,
                    height: entry.rect.height,
                  }
                : undefined
            }
          >
            <iframe
              key={entry.epoch}
              ref={iframeRefFor(entry.key)}
              src={entry.src}
              title="Preview"
              className={logical ? "block border-0" : "block size-full border-0"}
              style={
                logical
                  ? {
                      width: logical.width,
                      height: logical.height,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

interface PersistentPreviewBodyProps {
  /** Stable placeholder identity — the panel's pathStorageKey. */
  entryKey: string;
  /** `${sandboxId}:${port}` for group eviction. */
  group: string;
  src: string | undefined;
  epoch: number;
  /** True while an error overlay must show — hides the hosted iframe. */
  covered: boolean;
  /** Guest CSS viewport; null = fill the placeholder. */
  logicalSize: { width: number; height: number } | null;
  loading?: React.ReactNode;
}

/**
 * Drop-in replacement for WebPreviewBody: renders the measured placeholder
 * the host overlays, and wires the hosted iframe element into the enclosing
 * WebPreview's iframeRef so nav/history/annotation consumers keep working.
 *
 * The anchor div is keyed by everything the host reads at attach time, so a
 * change remounts it and re-runs the ref callback — an explicit update
 * channel that does not depend on closure identity.
 */
export function PersistentPreviewBody({
  entryKey,
  group,
  src,
  epoch,
  covered,
  logicalSize,
  loading,
}: PersistentPreviewBodyProps) {
  const { iframeRef } = useWebPreview();
  const effectiveSrc = covered ? undefined : src;
  const logicalKey = logicalSize
    ? `${logicalSize.width}x${logicalSize.height}`
    : "fill";

  return (
    <div className="relative size-full min-h-0 overflow-hidden">
      <div
        key={`${epoch}:${effectiveSrc ?? ""}:${logicalKey}`}
        ref={(node) => {
          if (node === null) return undefined;
          return attach(entryKey, {
            anchor: node,
            group,
            src: effectiveSrc,
            epoch,
            logical: logicalSize,
            onElement: (el) => {
              iframeRef.current = el;
            },
          });
        }}
        className="size-full"
      />
      {loading}
    </div>
  );
}
