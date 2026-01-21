import { extractReactTree, isReactAvailable } from "./react-extractor";

const OVERLAY_ID = "conductor-selection-overlay";
const INFO_ID = "conductor-selection-info";

let isActive = false;
let hoveredElement: HTMLElement | null = null;
let overlay: HTMLDivElement | null = null;
let infoBox: HTMLDivElement | null = null;

function createOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = OVERLAY_ID;
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    z-index: 2147483647;
    transition: all 0.05s ease;
    box-sizing: border-box;
  `;
  return el;
}

function createInfoBox(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = INFO_ID;
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    background: #1e293b;
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    z-index: 2147483647;
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  `;
  return el;
}

function getComponentInfo(element: HTMLElement): string {
  const fiberKey = Object.keys(element).find(
    (key) =>
      key.startsWith("__reactFiber$") ||
      key.startsWith("__reactInternalInstance$")
  );

  if (!fiberKey) {
    return element.tagName.toLowerCase();
  }

  const fiber = (element as Record<string, { type?: unknown }>)[fiberKey];
  if (!fiber) {
    return element.tagName.toLowerCase();
  }

  const type = fiber.type;
  if (typeof type === "function") {
    const fn = type as { displayName?: string; name?: string };
    return fn.displayName || fn.name || "Component";
  }

  if (typeof type === "string") {
    return type;
  }

  return element.tagName.toLowerCase();
}

function updateOverlayPosition(element: HTMLElement): void {
  if (!overlay || !infoBox) return;

  const rect = element.getBoundingClientRect();

  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  const componentName = getComponentInfo(element);
  infoBox.textContent = `<${componentName}>`;

  let infoTop = rect.top - 28;
  if (infoTop < 4) {
    infoTop = rect.bottom + 4;
  }

  let infoLeft = rect.left;
  if (infoLeft + 200 > window.innerWidth) {
    infoLeft = window.innerWidth - 210;
  }

  infoBox.style.top = `${infoTop}px`;
  infoBox.style.left = `${infoLeft}px`;
}

function handleMouseMove(e: MouseEvent): void {
  if (!isActive) return;

  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target || target === overlay || target === infoBox) return;

  const element = target as HTMLElement;
  if (element === hoveredElement) return;

  hoveredElement = element;
  updateOverlayPosition(element);
}

function handleClick(e: MouseEvent): void {
  if (!isActive || !hoveredElement) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const context = extractReactTree(hoveredElement);

  chrome.runtime.sendMessage({
    type: "ELEMENT_CAPTURED",
    payload: context,
  });

  deactivate();
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!isActive) return;

  if (e.key === "Escape") {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: "SELECTION_CANCELLED" });
    deactivate();
  }
}

export function activate(): void {
  if (isActive) return;

  if (!isReactAvailable()) {
    chrome.runtime.sendMessage({
      type: "SELECTION_CANCELLED",
      error: "React not detected on this page",
    });
    return;
  }

  isActive = true;

  overlay = createOverlay();
  infoBox = createInfoBox();
  document.body.appendChild(overlay);
  document.body.appendChild(infoBox);

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

  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeyDown, true);

  document.body.style.cursor = "";
}

export function isSelectionActive(): boolean {
  return isActive;
}
