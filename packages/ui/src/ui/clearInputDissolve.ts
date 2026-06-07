/** transitions.dev input clear with dissolve — see 13-input-clear-dissolve.md */

function readCssNumber(
  root: HTMLElement,
  name: string,
  fallback: number,
): number {
  const raw = getComputedStyle(root).getPropertyValue(name);
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readCssEase(root: HTMLElement, name: string): (t: number) => number {
  const raw = getComputedStyle(root).getPropertyValue(name);
  const match = raw.match(
    /cubic-bezier\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)/,
  );
  if (!match) {
    return (t) => t;
  }
  const x1 = parseFloat(match[1]);
  const y1 = parseFloat(match[2]);
  const x2 = parseFloat(match[3]);
  const y2 = parseFloat(match[4]);
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (t) => {
    if (t <= 0) {
      return 0;
    }
    if (t >= 1) {
      return 1;
    }
    let sample = t;
    for (let i = 0; i < 8; i += 1) {
      const dx = ((ax * sample + bx) * sample + cx) * sample - t;
      const derivative = (3 * ax * sample + 2 * bx) * sample + cx;
      if (Math.abs(dx) < 1e-6 || derivative === 0) {
        break;
      }
      sample -= dx / derivative;
    }
    return ((ay * sample + by) * sample + cy) * sample;
  };
}

function isDarkTheme(root: HTMLElement): boolean {
  return (
    root.classList.contains("dark") ||
    root.getAttribute("data-theme") === "dark"
  );
}

function measureCanvas(): CanvasRenderingContext2D | null {
  const canvas = document.createElement("canvas");
  return canvas.getContext("2d");
}

let sharedMeasureCanvas: CanvasRenderingContext2D | null = null;

function getMeasureCanvas(): CanvasRenderingContext2D | null {
  if (sharedMeasureCanvas === null) {
    sharedMeasureCanvas = measureCanvas();
  }
  return sharedMeasureCanvas;
}

export interface ClearDissolveElements {
  wrap: HTMLElement;
  input: HTMLInputElement;
  mirror: HTMLElement;
  placeholderLayer: HTMLElement;
  glow: HTMLElement;
}

function buildGlowBackground(
  wrap: HTMLElement,
  input: HTMLInputElement,
  text: string,
  root: HTMLElement,
): string {
  const canvas = getMeasureCanvas();
  if (canvas === null) {
    return "";
  }
  canvas.font = getComputedStyle(input).font;
  const dark = isDarkTheme(root);
  const rgb = dark ? "255,255,255" : "0,0,0";
  const width = wrap.clientWidth || 280;
  const padLeft = parseFloat(getComputedStyle(input).paddingLeft) || 12;
  const spread = readCssNumber(root, "--glow-spread", 1.5);
  const layers: string[] = [];
  let x = 0;
  for (const segment of text.split(/(\s+)/)) {
    const segmentWidth = canvas.measureText(segment).width;
    if (segment.trim()) {
      const centerX = padLeft + x + segmentWidth / 2;
      const halfWidth = Math.max(segmentWidth * 0.45, 8) * spread;
      const streaks: Array<[number, number, number, number]> = [
        [0, 0.8, 7, 0.22],
        [halfWidth * 0.45, 0.55, 8, 0.18],
        [-halfWidth * 0.4, 0.65, 6, 0.16],
        [halfWidth * 0.15, 0.9, 5, 0.14],
      ];
      for (const [dx, rwm, rh, alpha] of streaks) {
        const leftPercent = (((centerX + dx) / width) * 100).toFixed(2);
        layers.push(
          `radial-gradient(ellipse ${Math.max(halfWidth * rwm, 2).toFixed(1)}px ${rh}px at ${leftPercent}% 100%, rgba(${rgb},${alpha}), transparent)`,
        );
      }
    }
    x += segmentWidth;
  }
  return layers.join(", ");
}

function resetLayerStyles(
  mirror: HTMLElement,
  placeholderLayer: HTMLElement,
): void {
  mirror.style.cssText = "";
  placeholderLayer.style.cssText = "";
}

export function runClearInputDissolve(
  elements: ClearDissolveElements,
  onValueClear: () => void,
  onDone: () => void,
): void {
  const { wrap, input, mirror, placeholderLayer, glow } = elements;
  const root = document.documentElement;
  const text = input.value;
  if (text.length === 0) {
    return;
  }

  const keepFocus = document.activeElement === input;
  mirror.textContent = text.replace(/ /g, " ");

  const total = readCssNumber(root, "--clear-dur", 1000);
  const outDur = readCssNumber(root, "--clear-out-dur", 400);
  const inDur = readCssNumber(root, "--clear-in-dur", 400);
  const outFly = readCssNumber(root, "--clear-out-fly", 12);
  const inFly = readCssNumber(root, "--clear-in-fly", 12);
  const blur = readCssNumber(root, "--clear-blur", 2);
  const delay = readCssNumber(root, "--glow-delay", 50);
  const peakAt = readCssNumber(root, "--glow-peak-at", 0.15);
  const glowOpacity = readCssNumber(root, "--glow-opacity", 0.85);
  const easeOut = readCssEase(root, "--clear-out-ease");
  const easeIn = readCssEase(root, "--clear-in-ease");

  onValueClear();
  wrap.classList.remove("has-value");
  wrap.classList.add("is-clearing");
  glow.style.background = buildGlowBackground(
    wrap,
    input,
    mirror.textContent,
    root,
  );
  glow.style.opacity = "0";
  placeholderLayer.style.transform = `translateY(-${inFly}px)`;
  placeholderLayer.style.opacity = "0.9";
  placeholderLayer.style.filter = `blur(${blur}px)`;

  const startedAt = performance.now();

  function tick(now: number): void {
    const elapsed = now - startedAt;
    const outProgress = easeOut(Math.min(1, elapsed / outDur));
    mirror.style.transform = `translateY(${(outProgress * outFly).toFixed(1)}px)`;
    mirror.style.opacity = (1 - outProgress).toFixed(3);
    mirror.style.filter = `blur(${(outProgress * blur).toFixed(1)}px)`;

    const inProgress = easeIn(Math.min(1, elapsed / inDur));
    placeholderLayer.style.transform = `translateY(${(-inFly + inProgress * inFly).toFixed(1)}px)`;
    placeholderLayer.style.opacity = (0.9 + inProgress * 0.1).toFixed(3);
    placeholderLayer.style.filter = `blur(${(blur - inProgress * blur).toFixed(1)}px)`;

    let glowStrength = 0;
    if (elapsed > delay) {
      const glowProgress = Math.min(
        1,
        (elapsed - delay) / Math.max(1, total - delay),
      );
      glowStrength =
        glowProgress < peakAt
          ? glowProgress / peakAt
          : 1 - (glowProgress - peakAt) / (1 - peakAt);
    }
    glow.style.opacity = (glowStrength * glowOpacity).toFixed(3);

    if (elapsed < total) {
      requestAnimationFrame(tick);
      return;
    }

    wrap.classList.remove("is-clearing");
    resetLayerStyles(mirror, placeholderLayer);
    mirror.textContent = "";
    glow.style.opacity = "0";
    glow.style.background = "";
    onDone();
    if (keepFocus) {
      requestAnimationFrame(() => {
        input.focus({ preventScroll: true });
      });
    }
  }

  requestAnimationFrame(tick);
}
