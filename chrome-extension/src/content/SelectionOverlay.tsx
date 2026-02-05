import { useState, useEffect, useRef, useCallback } from "react";
import {
  extractReactTree,
  isReactAvailable,
  generateSelector,
  countComponents,
  detectReactVersion,
  getFiber,
  getComponentName,
  countFiberHooks,
  countFiberProps,
} from "./react-extractor";
import type { ElementInfo, ExtractedContext } from "@/shared/types";

interface SelectionOverlayProps {
  onCapture: (context: ExtractedContext) => void;
  onCancel: () => void;
}

function loadTheme(): Promise<"light" | "dark"> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["theme"], (result) => {
      resolve(result.theme === "light" ? "light" : "dark");
    });
  });
}

function getComponentInfo(element: HTMLElement): string {
  const fiber = getFiber(element);
  if (!fiber) return element.tagName.toLowerCase();
  return getComponentName(fiber);
}

function getParentChain(element: HTMLElement, maxDepth = 3): string[] {
  const chain: string[] = [];
  let current: HTMLElement | null = element.parentElement;
  while (current && chain.length < maxDepth && current !== document.body) {
    const fiber = getFiber(current);
    const name = fiber ? getComponentName(fiber) : current.tagName.toLowerCase();
    if (name && !name.startsWith("div") && !name.startsWith("span")) {
      chain.unshift(name);
    }
    current = current.parentElement;
  }
  return chain;
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
  };
}

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function SelectionOverlay({ onCapture, onCancel }: SelectionOverlayProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [hoverRect, setHoverRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [infoData, setInfoData] = useState<{
    componentName: string;
    parentChain: string[];
    propsCount: number;
    hooksCount: number;
    width: number;
    height: number;
    infoTop: number;
    infoLeft: number;
  } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const dark = theme === "dark";

  useEffect(() => {
    loadTheme().then(setTheme);
  }, []);

  useEffect(() => {
    document.body.style.cursor = "crosshair";
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  const updateInfoPosition = useCallback(
    (rect: DOMRect, element: HTMLElement) => {
      const fiber = getFiber(element);
      const componentName = getComponentInfo(element);
      const parentChain = getParentChain(element);
      const propsCount = countFiberProps(fiber);
      const hooksCount = countFiberHooks(fiber);
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      let infoTop = rect.top - 44;
      if (infoTop < 4) infoTop = rect.bottom + 8;
      let infoLeft = rect.left;
      if (infoLeft + 300 > window.innerWidth) infoLeft = window.innerWidth - 310;
      if (infoLeft < 4) infoLeft = 4;

      setInfoData({ componentName, parentChain, propsCount, hooksCount, width: w, height: h, infoTop, infoLeft });
    },
    [],
  );

  useEffect(() => {
    let mouseDownPos: { x: number; y: number } | null = null;

    function captureElement(element: HTMLElement, selectedText?: string) {
      const elementInfo = extractElementInfo(element);
      const hasReact = isReactAvailable();
      const reactTree = hasReact ? extractReactTree(element) : null;
      const context: ExtractedContext = {
        element: elementInfo,
        react: reactTree?.tree || null,
        selectedText,
        metadata: {
          capturedAt: Date.now(),
          sourceUrl: window.location.href,
          hasReact,
          totalComponents: reactTree ? countComponents(reactTree.tree) : 0,
          reactVersion: hasReact ? detectReactVersion() : "N/A",
        },
      };
      setCapturing(true);
      setTimeout(() => {
        onCapture(context);
        setCapturing(false);
        hoveredRef.current = null;
        setHoverRect(null);
        setInfoData(null);
      }, 200);
    }

    function handleMouseDown(e: MouseEvent) {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-conductor-overlay]")) return;
      mouseDownPos = { x: e.clientX, y: e.clientY };
    }

    function handleMouseUp(e: MouseEvent) {
      if (!mouseDownPos) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("[data-conductor-overlay]")) { mouseDownPos = null; return; }

      const selection = window.getSelection();
      const selText = selection?.toString().trim() || "";

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (selText.length > 0 && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const ancestor = range.commonAncestorContainer instanceof HTMLElement
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;
        if (ancestor) {
          captureElement(ancestor, selText);
        }
        selection.removeAllRanges();
      } else if (hoveredRef.current) {
        captureElement(hoveredRef.current);
      }
      mouseDownPos = null;
    }

    function handleMouseMove(e: MouseEvent) {
      if (mouseDownPos) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (
        !target ||
        target === overlayRef.current ||
        target === infoRef.current ||
        !(target instanceof HTMLElement)
      )
        return;
      if (target.closest("[data-conductor-overlay]")) return;
      if (target === hoveredRef.current) return;
      hoveredRef.current = target;
      const rect = target.getBoundingClientRect();
      setHoverRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      updateInfoPosition(rect, target);
    }

    function handleMouseOut(e: MouseEvent) {
      if (e.relatedTarget === null) {
        hoveredRef.current = null;
        setHoverRect(null);
        setInfoData(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Enter" && hoveredRef.current) {
        e.preventDefault();
        captureElement(hoveredRef.current);
        return;
      }
      if (!hoveredRef.current) return;

      let newElement: HTMLElement | null = null;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        newElement = hoveredRef.current.parentElement;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const firstChild = Array.from(hoveredRef.current.children).find(
          (c): c is HTMLElement => c instanceof HTMLElement,
        );
        newElement = firstChild || null;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        let sibling = hoveredRef.current.previousElementSibling;
        while (sibling && !(sibling instanceof HTMLElement)) {
          sibling = sibling.previousElementSibling;
        }
        newElement = sibling instanceof HTMLElement ? sibling : null;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        let sibling = hoveredRef.current.nextElementSibling;
        while (sibling && !(sibling instanceof HTMLElement)) {
          sibling = sibling.nextElementSibling;
        }
        newElement = sibling instanceof HTMLElement ? sibling : null;
      }

      if (newElement && newElement !== document.body && newElement !== document.documentElement) {
        hoveredRef.current = newElement;
        const rect = newElement.getBoundingClientRect();
        setHoverRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        updateInfoPosition(rect, newElement);
      }
    }

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("mouseout", handleMouseOut, true);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
    };
  }, [onCapture, onCancel, updateInfoPosition]);

  const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
  const hasReactInfo = infoData && (infoData.propsCount > 0 || infoData.hooksCount > 0);

  return (
    <>
      <>
        <div
          className="fixed inset-0 pointer-events-none rounded-md"
          style={{
            zIndex: 2147483644,
            border: "1px solid #14b8a6",
            boxSizing: "border-box",
          }}
        />
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 2147483644,
            border: "11px solid",
            borderImage: "linear-gradient(to right, #0d9488, #14b8a6) 1",
            boxSizing: "border-box",
            filter: "blur(20px)",
            animation: "conductor-glow 0.8s ease-in-out infinite alternate",
          }}
        />
      </>

      {hoverRect && (
        <>
          <div
            ref={overlayRef}
            className="fixed pointer-events-none border-2 border-blue-500 bg-blue-500/[0.08]"
            style={{
              zIndex: 2147483647,
              top: hoverRect.top,
              left: hoverRect.left,
              width: hoverRect.width,
              height: hoverRect.height,
              transition: "all 0.05s ease",
              boxSizing: "border-box",
              ...(capturing
                ? {
                    transform: "scale(1.03)",
                    opacity: 0.8,
                    transition:
                      "transform 0.15s ease-out, opacity 0.15s ease-out",
                  }
                : {}),
            }}
          >
            {corners.map((pos) => {
              const [v, h] = pos.split("-");
              return (
                <div
                  key={pos}
                  className="absolute bg-blue-500"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 1,
                    [v ?? "top"]: -4,
                    [h ?? "left"]: -4,
                  }}
                />
              );
            })}
          </div>

          <div
            className="fixed pointer-events-none bg-blue-500 text-white font-medium whitespace-nowrap"
            style={{
              zIndex: 2147483647,
              top: hoverRect.top + hoverRect.height + 4,
              left: hoverRect.left + hoverRect.width / 2,
              transform: "translateX(-50%)",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace",
              fontSize: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {Math.round(hoverRect.width)} × {Math.round(hoverRect.height)}
          </div>
        </>
      )}

      {infoData && (
        <div
          ref={infoRef}
          className={`fixed pointer-events-none rounded-lg border flex flex-col gap-1 ${dark ? "bg-white text-neutral-800 border-neutral-200" : "bg-neutral-800 text-neutral-100 border-neutral-700"}`}
          style={{
            zIndex: 2147483647,
            top: infoData.infoTop,
            left: infoData.infoLeft,
            maxWidth: 350,
            padding: "8px 12px",
            fontFamily: FONT,
            fontSize: 12,
            boxShadow: dark
              ? "0 2px 12px rgba(0,0,0,0.25)"
              : "0 2px 12px rgba(255,255,255,0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-teal-500 font-medium">
              &lt;{infoData.componentName}&gt;
            </span>
            <span
              className={`text-[11px] ${dark ? "text-neutral-500" : "text-neutral-400"}`}
            >
              {infoData.width}×{infoData.height}
            </span>
          </div>
          {infoData.parentChain.length > 0 && (
            <div
              className={`text-[11px] whitespace-nowrap overflow-hidden text-ellipsis ${dark ? "text-neutral-400" : "text-neutral-500"}`}
            >
              {infoData.parentChain.join(" › ")} › {infoData.componentName}
            </div>
          )}
          {hasReactInfo && (
            <div
              className={`text-[10px] ${dark ? "text-neutral-500" : "text-neutral-400"}`}
            >
              {[
                infoData.propsCount > 0 ? `${infoData.propsCount} props` : "",
                infoData.hooksCount > 0 ? `${infoData.hooksCount} hooks` : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </div>
      )}
    </>
  );
}
