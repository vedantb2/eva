export type EvaBlockType =
  | "callout"
  | "diff"
  | "file-tree"
  | "diagram"
  | "wireframe"
  | "image";

export type CalloutTone = "info" | "warn" | "decision";

export type CalloutBlockData = {
  tone: CalloutTone;
  markdown: string;
};

export type DiffMode = "split" | "unified";

export type DiffBlockData = {
  filename: string;
  language: string;
  before: string;
  after: string;
  mode: DiffMode;
  summary?: string;
  annotations?: Array<{ lines: string; note: string }>;
};

export type FileTreeChange = "added" | "modified" | "removed" | "renamed";

export type FileTreeEntry = {
  path: string;
  change: FileTreeChange;
  note?: string;
};

export type FileTreeBlockData = {
  entries: FileTreeEntry[];
};

export type DiagramKind = "mermaid" | "html";

export type DiagramBlockData = {
  kind: DiagramKind;
  source?: string;
  html?: string;
  css?: string;
};

export type WireframeSurface =
  | "browser"
  | "desktop"
  | "mobile"
  | "popover"
  | "panel";

export type WireframeBlockData = {
  surface: WireframeSurface;
  html: string;
  skeleton?: boolean;
};

export type ImageBlockData = {
  storageId?: string;
  alt?: string;
  width?: number;
};

export type EvaBlockDataByType = {
  callout: CalloutBlockData;
  diff: DiffBlockData;
  "file-tree": FileTreeBlockData;
  diagram: DiagramBlockData;
  wireframe: WireframeBlockData;
  image: ImageBlockData;
};

export type BlockProps<T extends EvaBlockType> = {
  blockId: string;
  data: EvaBlockDataByType[T];
  readOnly: boolean;
  onChange: (data: object) => void;
};

export const EVA_BLOCK_TYPES: EvaBlockType[] = [
  "callout",
  "diff",
  "file-tree",
  "diagram",
  "wireframe",
  "image",
];
