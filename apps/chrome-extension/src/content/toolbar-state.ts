export type ToolbarMode = "annotate" | "inspect" | null;

interface ToolbarState {
  visible: boolean;
  feedback: { message: string; type: "success" | "error" } | null;
  loading: boolean;
  x: number;
  y: number;
  mode: ToolbarMode;
  signedOut: boolean;
  projectModalOpen: boolean;
  version: number;
}

let _toolbar: ToolbarState = {
  visible: false,
  feedback: null,
  loading: false,
  x: -1,
  y: -1,
  mode: null,
  signedOut: false,
  projectModalOpen: false,
  version: 0,
};

const _subs = new Set<() => void>();
function _emit() {
  _subs.forEach((s) => s());
}

export function subscribeToolbar(cb: () => void): () => void {
  _subs.add(cb);
  return () => {
    _subs.delete(cb);
  };
}

export function getToolbarState(): ToolbarState {
  return _toolbar;
}

function bump(partial: Partial<ToolbarState>): void {
  _toolbar = { ..._toolbar, ...partial, version: _toolbar.version + 1 };
  _emit();
}

export function showToolbar(): void {
  bump({ visible: true });
}

export function hideToolbar(): void {
  if (_toolbar.mode) {
    _modeCleanup();
  }
  bump({
    visible: false,
    mode: null,
    projectModalOpen: false,
    signedOut: false,
  });
}

export function setToolbarLoading(loading: boolean): void {
  bump({ loading });
}

export function setToolbarFeedback(
  message: string,
  type: "success" | "error" = "success",
): void {
  bump({ feedback: { message, type }, loading: false });
  setTimeout(() => {
    bump({ feedback: null });
  }, 3000);
}

export function setSignedOut(value: boolean): void {
  bump({ signedOut: value });
}

export function setProjectModalOpen(open: boolean): void {
  bump({ projectModalOpen: open });
}

export function setToolbarPosition(x: number, y: number): void {
  bump({ x, y });
}

// ---- mode management ----

let _inspectController: { start: () => void; stop: () => void } | null = null;

export function registerInspectController(ctrl: {
  start: () => void;
  stop: () => void;
}): void {
  _inspectController = ctrl;
}

function _modeCleanup(): void {
  if (_toolbar.mode === "annotate") {
    // Import side-effect: deactivateAnnotation is called externally
  }
  if (_toolbar.mode === "inspect" && _inspectController) {
    _inspectController.stop();
  }
}

export function setMode(mode: ToolbarMode): void {
  if (_toolbar.mode === mode) {
    // Toggle off
    _modeCleanup();
    bump({ mode: null });
    return;
  }
  // Clean up previous mode
  _modeCleanup();
  if (mode === "inspect" && _inspectController) {
    _inspectController.start();
  }
  bump({ mode });
}
