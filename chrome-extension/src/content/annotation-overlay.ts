import {
  extractReactTree,
  isReactAvailable,
  generateSelector,
  countComponents,
  detectReactVersion,
} from "./react-extractor";
import type { ExtractedContext } from "@/shared/types";
import type { StoredPin } from "@/shared/messaging";

let isActive = false;
let pinCounter = 0;
const pins = new Map<string, HTMLDivElement>();
const pinTexts = new Map<string, string>();
const pinPositions = new Map<string, { x: number; y: number }>();
const pinContexts = new Map<string, ExtractedContext>();
const pinElements = new Map<string, HTMLElement>();
const pinSelectors = new Map<string, string>();
let activeInput: { container: HTMLDivElement; pinId: string } | null = null;
let activeTooltip: HTMLDivElement | null = null;
let hoveredElement: HTMLElement | null = null;
let highlightOverlay: HTMLDivElement | null = null;
let dimensionLabel: HTMLDivElement | null = null;
let isDragging = false;
let passiveListenersActive = false;
let glowOverlay: HTMLDivElement | null = null;
let glowStyle: HTMLStyleElement | null = null;

function getPageUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function collectPins(): Record<string, StoredPin> {
  const stored: Record<string, StoredPin> = {};
  for (const [id, pin] of pins) {
    if (!pin.dataset.saved) continue;
    const pos = pinPositions.get(id);
    if (!pos) continue;
    stored[id] = {
      x: pos.x,
      y: pos.y,
      text: pinTexts.get(id) || "",
      number: parseInt(pin.textContent || "0", 10),
      selector: pinSelectors.get(id) || "",
    };
  }
  return stored;
}

function persistAnnotations() {
  chrome.runtime.sendMessage({
    type: "ANNOTATIONS_CHANGED",
    payload: { pageUrl: getPageUrl(), pins: collectPins() },
  });
}

export function setAnnotationsFromRemote(stored: Record<string, StoredPin>) {
  pins.forEach((pin) => pin.remove());
  pins.clear();
  pinTexts.clear();
  pinPositions.clear();
  pinContexts.clear();
  pinElements.clear();
  pinSelectors.clear();
  pinCounter = 0;
  if (highlightOverlay) { highlightOverlay.remove(); highlightOverlay = null; }
  if (dimensionLabel) { dimensionLabel.remove(); dimensionLabel = null; }
  removePassiveListeners();

  let maxNum = 0;
  for (const [id, data] of Object.entries(stored)) {
    const { pinEl } = createPin(data.x, data.y, id);
    pinEl.dataset.saved = "true";
    pinEl.textContent = String(data.number);
    if (data.number > maxNum) maxNum = data.number;
    pinTexts.set(id, data.text);

    if (data.selector) {
      pinSelectors.set(id, data.selector);
      const el = document.querySelector(data.selector);
      if (el instanceof HTMLElement) {
        pinElements.set(id, el);
        pinContexts.set(id, captureElementContext(el));
      }
    }
  }
  pinCounter = maxNum;
  if (pins.size > 0) ensurePassiveListeners();
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function colors() {
  const dark = isDark();
  return {
    bg: dark ? "#1e293b" : "#ffffff",
    text: dark ? "#f1f5f9" : "#1e293b",
    textMuted: dark ? "#94a3b8" : "#64748b",
    border: dark ? "#334155" : "#e2e8f0",
    inputBg: dark ? "#0f172a" : "#ffffff",
  };
}

function createHighlightOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("data-conductor-annotation", "highlight");
  Object.assign(el.style, {
    position: "fixed",
    pointerEvents: "none",
    border: "2px solid #3b82f6",
    background: "rgba(59, 130, 246, 0.08)",
    zIndex: "2147483647",
    transition: "all 0.05s ease",
    boxSizing: "border-box",
  });

  for (const pos of ["top-left", "top-right", "bottom-left", "bottom-right"]) {
    const [vertical, horizontal] = pos.split("-");
    const corner = document.createElement("div");
    Object.assign(corner.style, {
      position: "absolute",
      width: "8px",
      height: "8px",
      background: "#3b82f6",
      borderRadius: "1px",
      [vertical]: "-4px",
      [horizontal]: "-4px",
    });
    el.appendChild(corner);
  }

  return el;
}

function createDimensionLabel(): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("data-conductor-annotation", "dimension");
  Object.assign(el.style, {
    position: "fixed",
    pointerEvents: "none",
    background: "#3b82f6",
    color: "white",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace",
    fontSize: "10px",
    fontWeight: "500",
    zIndex: "2147483647",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  });
  return el;
}

function ensureHighlightOverlay() {
  if (!highlightOverlay) {
    highlightOverlay = createHighlightOverlay();
    document.body.appendChild(highlightOverlay);
  }
  if (!dimensionLabel) {
    dimensionLabel = createDimensionLabel();
    document.body.appendChild(dimensionLabel);
  }
}

function updateHighlight(element: HTMLElement) {
  if (!highlightOverlay || !dimensionLabel) return;
  const rect = element.getBoundingClientRect();
  Object.assign(highlightOverlay.style, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  dimensionLabel.textContent = `${w} \u00d7 ${h}`;
  Object.assign(dimensionLabel.style, {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left + rect.width / 2}px`,
    transform: "translateX(-50%)",
  });
}

function hideHighlight() {
  if (highlightOverlay) highlightOverlay.style.display = "none";
  if (dimensionLabel) dimensionLabel.style.display = "none";
}

function showHighlight() {
  if (highlightOverlay) highlightOverlay.style.display = "";
  if (dimensionLabel) dimensionLabel.style.display = "";
}

function showPinElementHighlight(pinId: string) {
  const el = pinElements.get(pinId);
  if (!el || !el.isConnected) return;
  ensureHighlightOverlay();
  updateHighlight(el);
  showHighlight();
}

function handleMouseMove(e: MouseEvent) {
  if (!isActive || activeInput) return;
  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target || !(target instanceof HTMLElement)) return;
  if (target.closest("[data-conductor-annotation]")) return;
  if (target === hoveredElement) return;
  hoveredElement = target;
  showHighlight();
  updateHighlight(target);
}

function handleMouseOut(e: MouseEvent) {
  if (!isActive) return;
  if (e.relatedTarget === null) {
    hoveredElement = null;
    hideHighlight();
  }
}

function captureElementContext(element: HTMLElement): ExtractedContext {
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const hasReact = isReactAvailable();
  const reactResult = hasReact ? extractReactTree(element) : null;

  return {
    element: {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      classNames: Array.from(element.classList),
      textContent: (element.textContent || "").slice(0, 500),
      attributes: Object.fromEntries(
        Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
      ),
      boundingRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      computedStyles: {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
      },
      selector: generateSelector(element),
      innerHTML: element.innerHTML.slice(0, 1000),
      outerHTML: element.outerHTML.slice(0, 1000),
    },
    react: reactResult?.tree ?? null,
    metadata: {
      capturedAt: Date.now(),
      sourceUrl: window.location.href,
      hasReact,
      totalComponents: reactResult ? countComponents(reactResult.tree) : 0,
      reactVersion: hasReact ? detectReactVersion() : "N/A",
    },
  };
}

function showTooltip(pinId: string) {
  dismissTooltip();
  const text = pinTexts.get(pinId);
  const pos = pinPositions.get(pinId);
  if (!text || !pos) return;
  const c = colors();
  const tip = document.createElement("div");
  tip.setAttribute("data-conductor-annotation", "tooltip");
  Object.assign(tip.style, {
    position: "absolute",
    left: `${pos.x - 12}px`,
    top: `${pos.y + 18}px`,
    zIndex: "2147483645",
    maxWidth: "240px",
    background: c.bg,
    borderRadius: "6px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    border: `1px solid ${c.border}`,
    padding: "6px 8px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: "12px",
    color: c.text,
    lineHeight: "1.4",
    pointerEvents: "none",
  });
  tip.textContent = text;
  document.body.appendChild(tip);
  activeTooltip = tip;
}

function dismissTooltip() {
  if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; }
}

function createPin(x: number, y: number, existingId?: string): { pinEl: HTMLDivElement; pinId: string } {
  const pinEl = document.createElement("div");
  pinEl.setAttribute("data-conductor-annotation", "pin");
  Object.assign(pinEl.style, {
    position: "absolute",
    left: `${x - 12}px`,
    top: `${y - 12}px`,
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#14b8a6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "600",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    zIndex: "2147483645",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    border: "2px solid white",
    transition: "transform 0.15s, box-shadow 0.15s",
    userSelect: "none",
  });
  pinEl.textContent = "+";
  const pinId = existingId || crypto.randomUUID();
  const pos = { x, y };

  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let mouseDown = false;

  const onMouseMove = (e: MouseEvent) => {
    if (!mouseDown) return;
    const dx = e.pageX - dragStartX;
    const dy = e.pageY - dragStartY;
    if (!isDragging && Math.abs(dx) + Math.abs(dy) > 5) {
      isDragging = true;
      pinEl.style.transition = "none";
      pinEl.style.opacity = "0.8";
    }
    if (isDragging) {
      pinEl.style.left = `${e.pageX - dragOffsetX}px`;
      pinEl.style.top = `${e.pageY - dragOffsetY}px`;
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("mouseup", onMouseUp, true);
    mouseDown = false;

    if (isDragging) {
      const newX = e.pageX - dragOffsetX + 12;
      const newY = e.pageY - dragOffsetY + 12;
      pos.x = newX;
      pos.y = newY;
      pinPositions.set(pinId, { x: newX, y: newY });
      pinEl.style.transition = "transform 0.15s, box-shadow 0.15s";
      pinEl.style.opacity = "1";
      isDragging = false;
      if (pinEl.dataset.saved) persistAnnotations();
      return;
    }

    if (!pinEl.dataset.saved) return;
    dismissTooltip();
    dismissActiveInputOnly();
    hideHighlight();
    buildInputCard({ x: pos.x, y: pos.y, pinId, initialText: pinTexts.get(pinId) || "", isEdit: true });
  };

  pinEl.addEventListener("mouseenter", () => {
    if (pinEl.dataset.saved && !activeInput) {
      showTooltip(pinId);
      showPinElementHighlight(pinId);
    }
  });

  pinEl.addEventListener("mouseleave", () => {
    dismissTooltip();
    if (!activeInput) hideHighlight();
  });

  pinEl.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    mouseDown = true;
    isDragging = false;
    dragStartX = e.pageX;
    dragStartY = e.pageY;
    dragOffsetX = e.pageX - pinEl.offsetLeft;
    dragOffsetY = e.pageY - pinEl.offsetTop;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
  });

  document.body.appendChild(pinEl);
  pins.set(pinId, pinEl);
  pinPositions.set(pinId, pos);
  return { pinEl, pinId };
}

function removePin(pinId: string) {
  const pin = pins.get(pinId);
  if (pin) pin.remove();
  pins.delete(pinId);
  pinTexts.delete(pinId);
  pinPositions.delete(pinId);
  pinContexts.delete(pinId);
  pinElements.delete(pinId);
  pinSelectors.delete(pinId);
}

function saveAnnotation(pinId: string, title: string) {
  const pin = pins.get(pinId);
  if (!pin) return;
  if (!pin.dataset.saved) {
    pinCounter++;
    pin.dataset.saved = "true";
    pin.textContent = String(pinCounter);
  }
  pinTexts.set(pinId, title);
}

function dismissActiveInputOnly() {
  if (!activeInput) return;
  activeInput.container.remove();
  activeInput = null;
}

function buildInputCard(options: {
  x: number;
  y: number;
  pinId: string;
  initialText: string;
  isEdit: boolean;
}) {
  dismissActiveInputOnly();
  hideHighlight();
  showPinElementHighlight(options.pinId);

  const { x, y, pinId, initialText, isEdit } = options;
  const c = colors();
  const container = document.createElement("div");
  container.setAttribute("data-conductor-annotation", "input-card");
  Object.assign(container.style, {
    position: "absolute",
    left: `${x - 12}px`,
    top: `${y + 18}px`,
    zIndex: "2147483645",
    width: "260px",
    background: c.bg,
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
    border: `1px solid ${c.border}`,
    padding: "8px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  });

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Describe the issue...";
  input.value = initialText;
  Object.assign(input.style, {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${c.border}`,
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "13px",
    outline: "none",
    background: c.inputBg,
    color: c.text,
    fontFamily: "inherit",
  });

  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    display: "flex",
    gap: "6px",
    marginTop: "6px",
    justifyContent: "flex-end",
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  Object.assign(cancelBtn.style, {
    background: c.border,
    color: c.textMuted,
    border: "none",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
  });

  const addBtn = document.createElement("button");
  addBtn.textContent = isEdit ? "Update" : "Add";
  Object.assign(addBtn.style, {
    background: "#14b8a6",
    color: "white",
    border: "none",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  });

  const tickBtn = document.createElement("button");
  tickBtn.textContent = "\u2713 Task";
  Object.assign(tickBtn.style, {
    background: "#0f766e",
    color: "white",
    border: "none",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  });

  const doAdd = () => {
    const title = input.value.trim();
    if (!title) return;
    saveAnnotation(pinId, title);
    container.remove();
    activeInput = null;
    hideHighlight();
    persistAnnotations();
  };

  const doTask = () => {
    const title = input.value.trim();
    if (!title) return;
    chrome.runtime.sendMessage({
      type: "SAVE_ANNOTATION_TASK",
      payload: {
        title,
        pageUrl: window.location.href,
        position: { x, y },
        pinId,
        elementContext: pinContexts.get(pinId) ?? undefined,
      },
    });
    removePin(pinId);
    container.remove();
    activeInput = null;
    hideHighlight();
    persistAnnotations();
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  Object.assign(deleteBtn.style, {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
    marginRight: "auto",
    display: isEdit ? "" : "none",
  });

  deleteBtn.addEventListener("click", () => {
    removePin(pinId);
    container.remove();
    activeInput = null;
    hideHighlight();
    persistAnnotations();
  });

  addBtn.addEventListener("click", doAdd);
  tickBtn.addEventListener("click", doTask);

  cancelBtn.addEventListener("click", () => {
    container.remove();
    if (!isEdit) {
      const pin = pins.get(pinId);
      if (pin && !pin.dataset.saved) removePin(pinId);
    }
    activeInput = null;
    hideHighlight();
  });

  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") doAdd();
    if (e.key === "Escape") cancelBtn.click();
  });

  btnRow.appendChild(deleteBtn);
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(addBtn);
  btnRow.appendChild(tickBtn);
  container.appendChild(input);
  container.appendChild(btnRow);
  document.body.appendChild(container);
  activeInput = { container, pinId };
  input.focus();
}

function dismissActiveInput() {
  if (!activeInput) return;
  const pin = pins.get(activeInput.pinId);
  if (pin && !pin.dataset.saved) removePin(activeInput.pinId);
  activeInput.container.remove();
  activeInput = null;
  hideHighlight();
}

function handlePassiveClick(e: MouseEvent) {
  if (isDragging) return;
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest("[data-conductor-annotation]")) return;
  if (activeInput && !isActive) {
    dismissActiveInputOnly();
    hideHighlight();
  }
}

function handlePassiveKeyDown(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  if (activeInput) {
    dismissActiveInput();
    hideHighlight();
    e.preventDefault();
    return;
  }
  if (isActive) {
    deactivateAnnotation();
    chrome.runtime.sendMessage({ type: "STOP_ANNOTATION" });
    e.preventDefault();
  }
}

function ensurePassiveListeners() {
  if (passiveListenersActive) return;
  passiveListenersActive = true;
  document.addEventListener("click", handlePassiveClick, true);
  document.addEventListener("keydown", handlePassiveKeyDown, true);
}

function removePassiveListeners() {
  if (!passiveListenersActive) return;
  passiveListenersActive = false;
  document.removeEventListener("click", handlePassiveClick, true);
  document.removeEventListener("keydown", handlePassiveKeyDown, true);
}

function handleClick(e: MouseEvent) {
  if (!isActive || isDragging) return;
  if (activeInput) return;
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest("[data-conductor-annotation]")) return;

  e.preventDefault();
  e.stopPropagation();

  const { pinId } = createPin(e.pageX, e.pageY);
  if (hoveredElement) {
    pinContexts.set(pinId, captureElementContext(hoveredElement));
    pinElements.set(pinId, hoveredElement);
    pinSelectors.set(pinId, generateSelector(hoveredElement));
  }
  ensurePassiveListeners();
  hideHighlight();
  buildInputCard({ x: e.pageX, y: e.pageY, pinId, initialText: "", isEdit: false });
}

export function activateAnnotation() {
  if (isActive) return;
  isActive = true;
  document.body.style.cursor = "crosshair";

  ensureHighlightOverlay();
  hideHighlight();

  glowStyle = document.createElement("style");
  glowStyle.textContent = `
    @keyframes conductor-annotation-glow {
      0% { opacity: 0.3; }
      100% { opacity: 1.0; }
    }
  `;
  document.head.appendChild(glowStyle);

  glowOverlay = document.createElement("div");
  glowOverlay.setAttribute("data-conductor-annotation", "glow");
  glowOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483644;
    border: 10px solid;
    border-image: linear-gradient(to right, #0d9488, #14b8a6) 1;
    box-sizing: border-box;
    filter: blur(18px);
    animation: conductor-annotation-glow 0.8s ease-in-out infinite alternate;
  `;
  document.body.appendChild(glowOverlay);

  document.addEventListener("click", handleClick, true);
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("mouseout", handleMouseOut, true);
}

export function deactivateAnnotation() {
  if (!isActive) return;
  isActive = false;
  hoveredElement = null;
  document.body.style.cursor = "";

  if (glowOverlay) { glowOverlay.remove(); glowOverlay = null; }
  if (glowStyle) { glowStyle.remove(); glowStyle = null; }

  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("mouseout", handleMouseOut, true);

  dismissActiveInput();
  hideHighlight();
}

export function clearAllAnnotations() {
  if (isActive) deactivateAnnotation();
  pins.forEach((pin) => pin.remove());
  pins.clear();
  pinTexts.clear();
  pinPositions.clear();
  pinContexts.clear();
  pinElements.clear();
  pinSelectors.clear();
  pinCounter = 0;

  if (highlightOverlay) { highlightOverlay.remove(); highlightOverlay = null; }
  if (dimensionLabel) { dimensionLabel.remove(); dimensionLabel = null; }

  removePassiveListeners();
  chrome.runtime.sendMessage({
    type: "ANNOTATIONS_CHANGED",
    payload: { pageUrl: getPageUrl(), pins: {} },
  });
}

