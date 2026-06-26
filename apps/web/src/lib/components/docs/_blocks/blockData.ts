import type {
  CalloutBlockData,
  CalloutTone,
  DiagramBlockData,
  DiagramKind,
  DiffBlockData,
  DiffMode,
  EvaBlockDataByType,
  EvaBlockType,
  FileTreeBlockData,
  FileTreeChange,
  FileTreeEntry,
  ImageBlockData,
  WireframeBlockData,
  WireframeSurface,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" ? value : 0;
}

function readOptionalNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

function isCalloutTone(value: string): value is CalloutTone {
  return value === "info" || value === "warn" || value === "decision";
}

function isDiffMode(value: string): value is DiffMode {
  return value === "split" || value === "unified";
}

function isFileTreeChange(value: string): value is FileTreeChange {
  return (
    value === "added" ||
    value === "modified" ||
    value === "removed" ||
    value === "renamed"
  );
}

function isDiagramKind(value: string): value is DiagramKind {
  return value === "mermaid" || value === "html";
}

function isWireframeSurface(value: string): value is WireframeSurface {
  return (
    value === "browser" ||
    value === "desktop" ||
    value === "mobile" ||
    value === "popover" ||
    value === "panel"
  );
}

function parseFileTreeEntry(value: unknown): FileTreeEntry | null {
  if (!isRecord(value)) return null;
  const path = readString(value, "path");
  const change = readString(value, "change");
  if (!path || !isFileTreeChange(change)) return null;
  const note = readOptionalString(value, "note");
  return note ? { path, change, note } : { path, change };
}

export function defaultBlockData(blockType: "callout"): CalloutBlockData;
export function defaultBlockData(blockType: "diff"): DiffBlockData;
export function defaultBlockData(blockType: "file-tree"): FileTreeBlockData;
export function defaultBlockData(blockType: "diagram"): DiagramBlockData;
export function defaultBlockData(blockType: "wireframe"): WireframeBlockData;
export function defaultBlockData(blockType: "image"): ImageBlockData;
export function defaultBlockData(
  blockType: EvaBlockType,
): EvaBlockDataByType[EvaBlockType] {
  switch (blockType) {
    case "callout":
      return { tone: "info", markdown: "" };
    case "diff":
      return {
        filename: "example.ts",
        language: "typescript",
        before: "",
        after: "",
        mode: "split",
      };
    case "file-tree":
      return { entries: [] };
    case "diagram":
      return { kind: "mermaid", source: "flowchart LR\n  A --> B" };
    case "wireframe":
      return {
        surface: "browser",
        html: "<div class='wf-card'><p class='wf-muted'>Wireframe</p></div>",
      };
    case "image":
      return { alt: "" };
  }
}

export function parseBlockData(
  blockType: "callout",
  raw: unknown,
): CalloutBlockData;
export function parseBlockData(blockType: "diff", raw: unknown): DiffBlockData;
export function parseBlockData(
  blockType: "file-tree",
  raw: unknown,
): FileTreeBlockData;
export function parseBlockData(
  blockType: "diagram",
  raw: unknown,
): DiagramBlockData;
export function parseBlockData(
  blockType: "wireframe",
  raw: unknown,
): WireframeBlockData;
export function parseBlockData(
  blockType: "image",
  raw: unknown,
): ImageBlockData;
export function parseBlockData(
  blockType: EvaBlockType,
  raw: unknown,
): EvaBlockDataByType[EvaBlockType] {
  if (!isRecord(raw)) {
    switch (blockType) {
      case "callout":
        return defaultBlockData("callout");
      case "diff":
        return defaultBlockData("diff");
      case "file-tree":
        return defaultBlockData("file-tree");
      case "diagram":
        return defaultBlockData("diagram");
      case "wireframe":
        return defaultBlockData("wireframe");
      case "image":
        return defaultBlockData("image");
    }
  }

  switch (blockType) {
    case "callout": {
      const toneRaw = readString(raw, "tone");
      const tone = isCalloutTone(toneRaw) ? toneRaw : "info";
      return { tone, markdown: readString(raw, "markdown") };
    }
    case "diff": {
      const modeRaw = readString(raw, "mode");
      const mode = isDiffMode(modeRaw) ? modeRaw : "split";
      const annotationsRaw = raw.annotations;
      const annotations = Array.isArray(annotationsRaw)
        ? annotationsRaw
            .map((item) => {
              if (!isRecord(item)) return null;
              const lines = readString(item, "lines");
              const note = readString(item, "note");
              if (!lines || !note) return null;
              return { lines, note };
            })
            .filter(
              (item): item is { lines: string; note: string } => item !== null,
            )
        : undefined;
      const summary = readOptionalString(raw, "summary");
      const data: DiffBlockData = {
        filename: readString(raw, "filename"),
        language: readString(raw, "language"),
        before: readString(raw, "before"),
        after: readString(raw, "after"),
        mode,
      };
      if (summary) data.summary = summary;
      if (annotations && annotations.length > 0) data.annotations = annotations;
      return data;
    }
    case "file-tree": {
      const entriesRaw = raw.entries;
      const entries = Array.isArray(entriesRaw)
        ? entriesRaw
            .map(parseFileTreeEntry)
            .filter((entry): entry is FileTreeEntry => entry !== null)
        : [];
      return { entries };
    }
    case "diagram": {
      const kindRaw = readString(raw, "kind");
      const kind = isDiagramKind(kindRaw) ? kindRaw : "mermaid";
      const data: DiagramBlockData = { kind };
      const source = readOptionalString(raw, "source");
      const html = readOptionalString(raw, "html");
      const css = readOptionalString(raw, "css");
      if (source) data.source = source;
      if (html) data.html = html;
      if (css) data.css = css;
      return data;
    }
    case "wireframe": {
      const surfaceRaw = readString(raw, "surface");
      const surface = isWireframeSurface(surfaceRaw) ? surfaceRaw : "browser";
      const skeleton = readBoolean(raw, "skeleton");
      const data: WireframeBlockData = {
        surface,
        html: readString(raw, "html"),
      };
      if (skeleton !== undefined) data.skeleton = skeleton;
      return data;
    }
    case "image": {
      const storageId = readOptionalString(raw, "storageId");
      const alt = readOptionalString(raw, "alt");
      const width = readOptionalNumber(raw, "width");
      const data: ImageBlockData = {};
      if (storageId) data.storageId = storageId;
      if (alt) data.alt = alt;
      if (width !== undefined) data.width = width;
      return data;
    }
  }
}

export function isEvaBlockType(value: string): value is EvaBlockType {
  return (
    value === "callout" ||
    value === "diff" ||
    value === "file-tree" ||
    value === "diagram" ||
    value === "wireframe" ||
    value === "image"
  );
}
