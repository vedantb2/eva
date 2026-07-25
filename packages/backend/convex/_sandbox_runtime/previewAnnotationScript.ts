/**
 * Injected into previewed pages by the auth proxy (alongside nav-sync).
 * Must stay self-contained: embedded via `.toString()`, so no imports or
 * outer-scope references. Helpers nest inside the entry function.
 */

export interface EvaAnnotationContext {
  tagName: string;
  id: string;
  classNames: string[];
  selector: string;
  textContent: string;
  outerHTML: string;
  attributes: Record<string, string>;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
    display: string;
    position: string;
    margin: string;
    padding: string;
    borderRadius: string;
  };
  reactComponents: string[];
  pageUrl: string;
  pagePath: string;
  capturedAt: number;
}

/** Fully self-contained annotation tool for the preview iframe. */
export function evaPreviewAnnotationScript(): void {
  const ATTR = "data-eva-annotate";
  const root = document.documentElement;
  if (root.getAttribute(ATTR) === "1") {
    return;
  }
  root.setAttribute(ATTR, "1");

  let parentOrigin = "*";
  try {
    if (document.referrer) {
      parentOrigin = new URL(document.referrer).origin;
    }
  } catch {
    /* keep "*" */
  }

  let modeActive = false;
  let selectedEl: Element | null = null;
  let overlay: HTMLDivElement | null = null;
  let labelEl: HTMLDivElement | null = null;
  let rectRaf = 0;

  function post(
    payload:
      | { type: "eva-preview-annotate-ready" }
      | {
          type: "eva-preview-annotate-selected";
          context: EvaAnnotationContext;
          rect: {
            top: number;
            left: number;
            width: number;
            height: number;
          };
        }
      | {
          type: "eva-preview-annotate-rect";
          rect: {
            top: number;
            left: number;
            width: number;
            height: number;
          } | null;
        }
      | { type: "eva-preview-annotate-dismissed" },
  ): void {
    window.parent.postMessage(payload, parentOrigin);
  }

  function ensureOverlay(): void {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.setAttribute("data-eva-annotate-overlay", "1");
    overlay.style.cssText =
      "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #3b82f6;background:rgba(59,130,246,0.12);border-radius:2px;display:none;box-sizing:border-box;";
    labelEl = document.createElement("div");
    labelEl.style.cssText =
      "position:fixed;pointer-events:none;z-index:2147483647;background:#1e293b;color:#f8fafc;font:12px/1.3 ui-sans-serif,system-ui,sans-serif;padding:2px 6px;border-radius:3px;display:none;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    document.documentElement.appendChild(overlay);
    document.documentElement.appendChild(labelEl);
  }

  function escapeCssIdent(value: string): string {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function generateSelector(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += "#" + escapeCssIdent(current.id);
        parts.unshift(selector);
        break;
      }
      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).slice(0, 2);
        if (classes.length > 0 && classes[0]) {
          selector += "." + classes.map((c) => escapeCssIdent(c)).join(".");
        }
      }
      const parentEl: HTMLElement | null = current.parentElement;
      if (parentEl) {
        const currentElement = current;
        const siblings: Element[] = [];
        for (let i = 0; i < parentEl.children.length; i++) {
          const child = parentEl.children.item(i);
          if (child && child.tagName === currentElement.tagName) {
            siblings.push(child);
          }
        }
        if (siblings.length > 1) {
          const index = siblings.indexOf(currentElement) + 1;
          selector += ":nth-of-type(" + index + ")";
        }
      }
      parts.unshift(selector);
      current = parentEl;
    }
    return parts.join(" > ");
  }

  function collectReactNames(element: Element): string[] {
    const names: string[] = [];
    let fiber: object | null = null;
    const keys = Object.keys(element);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!key) continue;
      if (
        !key.startsWith("__reactFiber$") &&
        !key.startsWith("__reactInternalInstance$")
      ) {
        continue;
      }
      const value = Reflect.get(element, key);
      if (value && typeof value === "object") {
        fiber = value;
        break;
      }
    }
    let current = fiber;
    while (current && names.length < 3) {
      const typeVal = Reflect.get(current, "type");
      if (typeof typeVal === "function") {
        const displayName = Reflect.get(typeVal, "displayName");
        const name =
          typeof displayName === "string" && displayName
            ? displayName
            : typeVal.name;
        if (name && names.indexOf(name) === -1) {
          names.push(name);
        }
      }
      const next = Reflect.get(current, "return");
      current = next && typeof next === "object" ? next : null;
    }
    return names;
  }

  function captureContext(element: HTMLElement): EvaAnnotationContext {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const classNames = Array.from(element.classList);
    const attributes: Record<string, string> = {};
    const attrs = element.attributes;
    for (
      let i = 0;
      i < attrs.length && Object.keys(attributes).length < 20;
      i++
    ) {
      const attr = attrs.item(i);
      if (!attr) continue;
      attributes[attr.name] = attr.value.slice(0, 200);
    }
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || "",
      classNames,
      selector: generateSelector(element),
      textContent: text.slice(0, 300),
      outerHTML: element.outerHTML.slice(0, 2048),
      attributes,
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
        fontWeight: styles.fontWeight,
        fontFamily: styles.fontFamily,
        display: styles.display,
        position: styles.position,
        margin: styles.margin,
        padding: styles.padding,
        borderRadius: styles.borderRadius,
      },
      reactComponents: collectReactNames(element),
      pageUrl: window.location.href,
      pagePath: window.location.pathname + window.location.search,
      capturedAt: Date.now(),
    };
  }

  function paintBox(
    target: Element | null,
    label: string,
    selected: boolean,
  ): void {
    ensureOverlay();
    if (!overlay || !labelEl) return;
    if (!target) {
      overlay.style.display = "none";
      labelEl.style.display = "none";
      return;
    }
    const rect = target.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.top = rect.top + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.width = Math.max(0, rect.width) + "px";
    overlay.style.height = Math.max(0, rect.height) + "px";
    overlay.style.borderColor = selected ? "#2563eb" : "#3b82f6";
    overlay.style.background = selected
      ? "rgba(37,99,235,0.16)"
      : "rgba(59,130,246,0.12)";
    labelEl.style.display = "block";
    labelEl.textContent = label;
    const labelTop = Math.max(0, rect.top - 22);
    labelEl.style.top = labelTop + "px";
    labelEl.style.left = Math.max(0, rect.left) + "px";
  }

  function chipLabel(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const cls =
      el instanceof HTMLElement && el.classList.length > 0
        ? "." + el.classList[0]
        : "";
    const react = collectReactNames(el);
    const reactPrefix = react[0] ? react[0] + " " : "";
    return reactPrefix + "<" + tag + cls + ">";
  }

  function clearAll(): void {
    selectedEl = null;
    paintBox(null, "", false);
  }

  function setMode(active: boolean): void {
    modeActive = active;
    document.documentElement.style.cursor = active ? "crosshair" : "";
    if (!active) {
      clearAll();
    }
  }

  function scheduleRectReport(): void {
    if (rectRaf) return;
    rectRaf = window.requestAnimationFrame(() => {
      rectRaf = 0;
      if (!selectedEl || !document.contains(selectedEl)) {
        post({ type: "eva-preview-annotate-rect", rect: null });
        return;
      }
      const rect = selectedEl.getBoundingClientRect();
      post({
        type: "eva-preview-annotate-rect",
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      });
      paintBox(selectedEl, chipLabel(selectedEl), true);
    });
  }

  function onMouseMove(event: MouseEvent): void {
    if (!modeActive) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target === overlay ||
      target === labelEl ||
      (target instanceof HTMLElement &&
        target.getAttribute("data-eva-annotate-overlay") === "1")
    ) {
      return;
    }
    if (selectedEl) return;
    paintBox(target, chipLabel(target), false);
  }

  function onClick(event: MouseEvent): void {
    if (!modeActive) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (
      target === overlay ||
      target === labelEl ||
      target.getAttribute("data-eva-annotate-overlay") === "1"
    ) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    selectedEl = target;
    const context = captureContext(target);
    const rect = target.getBoundingClientRect();
    paintBox(target, chipLabel(target), true);
    post({
      type: "eva-preview-annotate-selected",
      context,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!modeActive) return;
    if (event.key === "Escape") {
      event.preventDefault();
      clearAll();
      post({ type: "eva-preview-annotate-dismissed" });
    }
  }

  function onScrollOrResize(): void {
    if (!modeActive || !selectedEl) return;
    scheduleRectReport();
  }

  window.addEventListener("message", (event) => {
    if (parentOrigin !== "*" && event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;
    const type = Reflect.get(data, "type");
    if (type === "eva-preview-annotate-mode") {
      const active = Reflect.get(data, "active") === true;
      setMode(active);
      return;
    }
    if (type === "eva-preview-annotate-clear") {
      clearAll();
    }
  });

  document.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);

  post({ type: "eva-preview-annotate-ready" });
}

/** Source string injected into preview HTML by the sandbox proxy. */
export function buildAnnotationScriptSource(): string {
  return "(" + evaPreviewAnnotationScript.toString() + ")();";
}
