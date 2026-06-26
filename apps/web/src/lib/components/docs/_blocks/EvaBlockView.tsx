"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import type { Id } from "@conductor/backend";
import { renderEvaBlock } from "./registry";

export function EvaBlockView({
  node,
  updateAttributes,
  editor,
  extension,
}: ReactNodeViewProps) {
  const blockId =
    typeof node.attrs.blockId === "string" ? node.attrs.blockId : "";
  const blockType =
    typeof node.attrs.blockType === "string" ? node.attrs.blockType : "";
  const readOnly = !editor.isEditable;
  const docId = extension.options.docId;

  return (
    <NodeViewWrapper className="my-3" data-eva-block-wrapper>
      {renderEvaBlock({
        blockType,
        blockId,
        data: node.attrs.data,
        readOnly,
        docId,
        onChange: (data) => {
          updateAttributes({ data });
        },
      })}
    </NodeViewWrapper>
  );
}

export type EvaBlockOptions = {
  docId?: Id<"docs">;
};
