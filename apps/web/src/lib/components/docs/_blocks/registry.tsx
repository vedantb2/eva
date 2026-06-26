"use client";

import type { ComponentType } from "react";
import type { Id } from "@conductor/backend";
import type { BlockProps, EvaBlockDataByType, EvaBlockType } from "./types";
import { parseBlockData } from "./blockData";
import { CalloutBlock } from "./renderers/CalloutBlock";
import { DiffBlock } from "./renderers/DiffBlock";
import { FileTreeBlock } from "./renderers/FileTreeBlock";
import { DiagramBlock } from "./renderers/DiagramBlock";
import { WireframeBlock } from "./renderers/WireframeBlock";
import { ImageBlock } from "./renderers/ImageBlock";

type RendererComponent<T extends EvaBlockType> = ComponentType<
  BlockProps<T> & (T extends "image" ? { docId: Id<"docs"> } : object)
>;

type EvaBlockRendererEntry<T extends EvaBlockType> = {
  Read: RendererComponent<T>;
  Edit?: RendererComponent<T>;
};

export const EVA_BLOCK_RENDERERS: {
  [K in EvaBlockType]: EvaBlockRendererEntry<K>;
} = {
  callout: { Read: CalloutBlock, Edit: CalloutBlock },
  diff: { Read: DiffBlock, Edit: DiffBlock },
  "file-tree": { Read: FileTreeBlock, Edit: FileTreeBlock },
  diagram: { Read: DiagramBlock, Edit: DiagramBlock },
  wireframe: { Read: WireframeBlock, Edit: WireframeBlock },
  image: { Read: ImageBlock, Edit: ImageBlock },
};

export function renderEvaBlock({
  blockType,
  blockId,
  data,
  readOnly,
  onChange,
  docId,
}: {
  blockType: string;
  blockId: string;
  data: unknown;
  readOnly: boolean;
  onChange: (data: object) => void;
  docId?: Id<"docs">;
}) {
  if (blockType === "callout") {
    const parsed = parseBlockData("callout", data);
    const Component = readOnly
      ? EVA_BLOCK_RENDERERS.callout.Read
      : (EVA_BLOCK_RENDERERS.callout.Edit ?? EVA_BLOCK_RENDERERS.callout.Read);
    return (
      <Component
        blockId={blockId}
        data={parsed}
        readOnly={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }
  if (blockType === "diff") {
    const parsed = parseBlockData("diff", data);
    const Component = readOnly
      ? EVA_BLOCK_RENDERERS.diff.Read
      : (EVA_BLOCK_RENDERERS.diff.Edit ?? EVA_BLOCK_RENDERERS.diff.Read);
    return (
      <Component
        blockId={blockId}
        data={parsed}
        readOnly={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }
  if (blockType === "file-tree") {
    const parsed = parseBlockData("file-tree", data);
    const Component = readOnly
      ? EVA_BLOCK_RENDERERS["file-tree"].Read
      : (EVA_BLOCK_RENDERERS["file-tree"].Edit ??
        EVA_BLOCK_RENDERERS["file-tree"].Read);
    return (
      <Component
        blockId={blockId}
        data={parsed}
        readOnly={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }
  if (blockType === "diagram") {
    const parsed = parseBlockData("diagram", data);
    const Component = readOnly
      ? EVA_BLOCK_RENDERERS.diagram.Read
      : (EVA_BLOCK_RENDERERS.diagram.Edit ?? EVA_BLOCK_RENDERERS.diagram.Read);
    return (
      <Component
        blockId={blockId}
        data={parsed}
        readOnly={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }
  if (blockType === "wireframe") {
    const parsed = parseBlockData("wireframe", data);
    const Component = readOnly
      ? EVA_BLOCK_RENDERERS.wireframe.Read
      : (EVA_BLOCK_RENDERERS.wireframe.Edit ??
        EVA_BLOCK_RENDERERS.wireframe.Read);
    return (
      <Component
        blockId={blockId}
        data={parsed}
        readOnly={readOnly}
        onChange={(next) => onChange(next)}
      />
    );
  }
  if (blockType === "image") {
    const parsed = parseBlockData("image", data);
    const Component = readOnly
      ? EVA_BLOCK_RENDERERS.image.Read
      : (EVA_BLOCK_RENDERERS.image.Edit ?? EVA_BLOCK_RENDERERS.image.Read);
    if (!docId) {
      return (
        <div className="rounded-surface border border-border p-3 text-sm text-muted-foreground">
          Image block requires a document context.
        </div>
      );
    }
    return (
      <Component
        blockId={blockId}
        data={parsed}
        readOnly={readOnly}
        onChange={(next) => onChange(next)}
        docId={docId}
      />
    );
  }

  return (
    <div className="rounded-surface border border-border p-3 text-sm text-muted-foreground">
      Unknown block type: {blockType}
    </div>
  );
}
