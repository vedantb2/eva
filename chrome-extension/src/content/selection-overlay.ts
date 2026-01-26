import { extractReactTree, isReactAvailable, generateSelector, countComponents, detectReactVersion } from "./react-extractor";
import type { ElementInfo, ExtractedContext } from "@/shared/types";

const OVERLAY_ID = "conductor-selection-overlay";
const INFO_ID = "conductor-selection-info";
const DIMENSION_ID = "conductor-dimension-label";

let isActive = false;
let hoveredElement: HTMLElement | null = null;
let overlay: HTMLDivElement | null = null;
let infoBox: HTMLDivElement | null = null;
let dimensionLabel: HTMLDivElement | null = null;
let currentTheme: "light" | "dark" = "dark";

function loadTheme(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["theme"], (result) => {
      currentTheme = result.theme === "light" ? "light" : "dark";
      resolve();
    });
  });
}

function isDarkMode(): boolean {
  return currentTheme === "dark";
}

const colors = {
  get accent() { return "#3b82f6"; },
  get bg() { return isDarkMode() ? "#1e293b" : "#ffffff"; },
  get text() { return isDarkMode() ? "#f1f5f9" : "#1e293b"; },
  get textMuted() { return isDarkMode() ? "#94a3b8" : "#64748b"; },
  get textDim() { return isDarkMode() ? "#64748b" : "#94a3b8"; },
  get textHint() { return isDarkMode() ? "#64748b" : "#94a3b8"; },
  get border() { return isDarkMode() ? "#334155" : "#e2e8f0"; },
  get shadow() { return isDarkMode() ? "0 2px 8px rgba(0, 0, 0, 0.6)" : "0 2px 8px rgba(0, 0, 0, 0.2)"; },
};

function createOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = OVERLAY_ID;
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    z-index: 2147483647;
    transition: all 0.05s ease;
    box-sizing: border-box;
  `;

  const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
  corners.forEach((pos) => {
    const corner = document.createElement("div");
    const [vertical, horizontal] = pos.split("-");
    corner.style.cssText = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: #3b82f6;
      border-radius: 1px;
      ${vertical}: -4px;
      ${horizontal}: -4px;
    `;
    el.appendChild(corner);
  });

  return el;
}

function createDimensionLabel(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = DIMENSION_ID;
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    background: ${colors.accent};
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    font-size: 10px;
    font-weight: 500;
    z-index: 2147483647;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  `;
  return el;
}

function createInfoBox(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = INFO_ID;
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    background: ${colors.bg};
    color: ${colors.text};
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${colors.border};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    z-index: 2147483647;
    max-width: 350px;
    box-shadow: ${colors.shadow};
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;
  return el;
}

interface FiberNode {
  type?: unknown;
  return?: FiberNode;
  memoizedState?: unknown;
  memoizedProps?: Record<string, unknown>;
}

function getFiber(element: HTMLElement): FiberNode | null {
  const fiberKey = Object.keys(element).find(
    (key) =>
      key.startsWith("__reactFiber$") ||
      key.startsWith("__reactInternalInstance$")
  );
  if (!fiberKey) return null;
  return (element as Record<string, FiberNode>)[fiberKey] || null;
}

function getComponentName(fiber: FiberNode | null, element: HTMLElement): string {
  if (!fiber) return element.tagName.toLowerCase();

  const type = fiber.type;
  if (typeof type === "function") {
    const fn = type as { displayName?: string; name?: string };
    return fn.displayName || fn.name || "Component";
  }
  if (typeof type === "string") return type;
  return element.tagName.toLowerCase();
}

function getComponentInfo(element: HTMLElement): string {
  return getComponentName(getFiber(element), element);
}

function getParentChain(element: HTMLElement, maxDepth = 3): string[] {
  const chain: string[] = [];
  let current: HTMLElement | null = element.parentElement;

  while (current && chain.length < maxDepth && current !== document.body) {
    const fiber = getFiber(current);
    const name = getComponentName(fiber, current);
    if (name && !name.startsWith("div") && !name.startsWith("span")) {
      chain.unshift(name);
    }
    current = current.parentElement;
  }

  return chain;
}

function countHooks(fiber: FiberNode | null): number {
  if (!fiber) return 0;
  let count = 0;
  let hook = fiber.memoizedState as { next?: unknown } | null;
  while (hook && typeof hook === "object") {
    count++;
    hook = hook.next as { next?: unknown } | null;
  }
  return count;
}

function countProps(fiber: FiberNode | null): number {
  if (!fiber || !fiber.memoizedProps) return 0;
  return Object.keys(fiber.memoizedProps).filter(k => k !== "children").length;
}

function updateOverlayPosition(element: HTMLElement): void {
  if (!overlay || !infoBox || !dimensionLabel) return;

  const rect = element.getBoundingClientRect();

  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  dimensionLabel.textContent = `${w} × ${h}`;
  dimensionLabel.style.top = `${rect.bottom + 4}px`;
  dimensionLabel.style.left = `${rect.left + rect.width / 2}px`;
  dimensionLabel.style.transform = "translateX(-50%)";

  const fiber = getFiber(element);
  const componentName = getComponentName(fiber, element);
  const parentChain = getParentChain(element);
  const propsCount = countProps(fiber);
  const hooksCount = countHooks(fiber);
  const hasReactInfo = fiber && (propsCount > 0 || hooksCount > 0);

  infoBox.innerHTML = "";
  infoBox.style.background = colors.bg;
  infoBox.style.color = colors.text;
  infoBox.style.borderColor = colors.border;
  infoBox.style.boxShadow = colors.shadow;

  const line1 = document.createElement("div");
  line1.style.cssText = "display: flex; align-items: center; gap: 8px;";
  line1.innerHTML = `<span style="color: ${colors.accent}; font-weight: 500;">&lt;${componentName}&gt;</span><span style="color: ${colors.textMuted}; font-size: 11px;">${w}×${h}</span>`;
  infoBox.appendChild(line1);

  if (parentChain.length > 0) {
    const line2 = document.createElement("div");
    line2.style.cssText = `color: ${colors.textDim}; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
    line2.textContent = parentChain.join(" › ") + " › " + componentName;
    infoBox.appendChild(line2);
  }

  if (hasReactInfo) {
    const line3 = document.createElement("div");
    line3.style.cssText = `color: ${colors.textMuted}; font-size: 10px;`;
    const parts: string[] = [];
    if (propsCount > 0) parts.push(`${propsCount} props`);
    if (hooksCount > 0) parts.push(`${hooksCount} hooks`);
    line3.textContent = parts.join(" · ");
    infoBox.appendChild(line3);
  }

  const line4 = document.createElement("div");
  line4.style.cssText = `color: ${colors.textHint}; font-size: 10px; margin-top: 2px;`;
  line4.textContent = "↑↓←→ navigate · Enter select · Esc cancel";
  infoBox.appendChild(line4);

  let infoTop = rect.top - infoBox.offsetHeight - 8;
  if (infoTop < 4) {
    infoTop = rect.bottom + 24;
  }

  let infoLeft = rect.left;
  if (infoLeft + 300 > window.innerWidth) {
    infoLeft = window.innerWidth - 310;
  }
  if (infoLeft < 4) infoLeft = 4;

  infoBox.style.top = `${infoTop}px`;
  infoBox.style.left = `${infoLeft}px`;
}

function handleMouseMove(e: MouseEvent): void {
  if (!isActive) return;

  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target || target === overlay || target === infoBox || target === dimensionLabel) return;

  const element = target as HTMLElement;
  if (element === hoveredElement) return;

  hoveredElement = element;
  updateOverlayPosition(element);
}

function extractElementInfo(element: HTMLElement): ElementInfo {
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    classNames: Array.from(element.classList),
    textContent: (element.textContent || "").slice(0, 500),
    attributes: Object.fromEntries(
      Array.from(element.attributes).map(attr => [attr.name, attr.value])
    ),
    boundingRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    computedStyles: {
      color: styles.color,
      backgroundColor: styles.backgroundColor,
      fontSize: styles.fontSize,
      fontFamily: styles.fontFamily,
    },
    selector: generateSelector(element),
    innerHTML: element.innerHTML.slice(0, 1000),
    outerHTML: element.outerHTML.slice(0, 1000),
  };
}

function playCaptureAnimation(callback: () => void): void {
  if (!overlay) {
    callback();
    return;
  }

  overlay.style.transition = "transform 0.15s ease-out, opacity 0.15s ease-out";
  overlay.style.transform = "scale(1.03)";
  overlay.style.opacity = "0.8";

  setTimeout(() => {
    if (overlay) {
      overlay.style.transform = "scale(1)";
      overlay.style.opacity = "0";
    }
    setTimeout(callback, 100);
  }, 100);
}

function handleClick(e: MouseEvent): void {
  if (!isActive || !hoveredElement) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const elementInfo = extractElementInfo(hoveredElement);
  const hasReact = isReactAvailable();
  const reactTree = hasReact ? extractReactTree(hoveredElement) : null;

  const context: ExtractedContext = {
    element: elementInfo,
    react: reactTree?.tree || null,
    metadata: {
      capturedAt: Date.now(),
      sourceUrl: window.location.href,
      hasReact,
      totalComponents: reactTree ? countComponents(reactTree.tree) : 0,
      reactVersion: hasReact ? detectReactVersion() : "N/A",
    },
  };

  playCaptureAnimation(() => {
    chrome.runtime.sendMessage({
      type: "ELEMENT_CAPTURED",
      payload: context,
    });
    deactivate();
  });
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!isActive) return;

  if (e.key === "Escape") {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: "SELECTION_CANCELLED" });
    deactivate();
    return;
  }

  if (e.key === "Enter" && hoveredElement) {
    e.preventDefault();
    handleClick(e as unknown as MouseEvent);
    return;
  }

  if (!hoveredElement) return;

  let newElement: HTMLElement | null = null;

  if (e.key === "ArrowUp") {
    e.preventDefault();
    newElement = hoveredElement.parentElement;
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    const firstChild = Array.from(hoveredElement.children).find(
      (c): c is HTMLElement => c instanceof HTMLElement
    );
    newElement = firstChild || null;
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    let sibling = hoveredElement.previousElementSibling;
    while (sibling && !(sibling instanceof HTMLElement)) {
      sibling = sibling.previousElementSibling;
    }
    newElement = sibling as HTMLElement | null;
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    let sibling = hoveredElement.nextElementSibling;
    while (sibling && !(sibling instanceof HTMLElement)) {
      sibling = sibling.nextElementSibling;
    }
    newElement = sibling as HTMLElement | null;
  }

  if (newElement && newElement !== document.body && newElement !== document.documentElement) {
    hoveredElement = newElement;
    updateOverlayPosition(newElement);
  }
}

export async function activate(): Promise<void> {
  if (isActive) return;

  await loadTheme();
  isActive = true;

  overlay = createOverlay();
  infoBox = createInfoBox();
  dimensionLabel = createDimensionLabel();
  document.body.appendChild(overlay);
  document.body.appendChild(infoBox);
  document.body.appendChild(dimensionLabel);

  document.documentElement.style.outline = "2px solid #3b82f6";
  document.documentElement.style.outlineOffset = "-2px";

  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeyDown, true);

  document.body.style.cursor = "crosshair";
}

export function deactivate(): void {
  if (!isActive) return;

  isActive = false;
  hoveredElement = null;

  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  if (infoBox) {
    infoBox.remove();
    infoBox = null;
  }

  if (dimensionLabel) {
    dimensionLabel.remove();
    dimensionLabel = null;
  }

  document.documentElement.style.outline = "";
  document.documentElement.style.outlineOffset = "";

  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeyDown, true);

  document.body.style.cursor = "";
}

export function isSelectionActive(): boolean {
  return isActive;
}
