"use client";

import type { Editor } from "@tiptap/core";
import { Button } from "@conductor/ui";
import {
  IconAlertCircle,
  IconBinaryTree,
  IconChartDots,
  IconColumns,
  IconPhoto,
  IconRoute,
} from "@tabler/icons-react";
import { EVA_BLOCK_TYPES, type EvaBlockType } from "../_blocks/types";

const BLOCK_LABELS: Record<EvaBlockType, string> = {
  callout: "Callout",
  diff: "Diff",
  "file-tree": "File tree",
  diagram: "Diagram",
  wireframe: "Wireframe",
  image: "Image",
};

const BLOCK_ICONS: Record<EvaBlockType, typeof IconAlertCircle> = {
  callout: IconAlertCircle,
  diff: IconColumns,
  "file-tree": IconBinaryTree,
  diagram: IconChartDots,
  wireframe: IconRoute,
  image: IconPhoto,
};

export function DocBlockMenu({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
      {EVA_BLOCK_TYPES.map((blockType) => {
        const Icon = BLOCK_ICONS[blockType];
        return (
          <Button
            key={blockType}
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => editor.commands.insertEvaBlock(blockType)}
          >
            <Icon size={14} />
            {BLOCK_LABELS[blockType]}
          </Button>
        );
      })}
    </div>
  );
}
