"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { suggestChangesKey } from "@handlewithcare/prosemirror-suggest-changes";
import { nanoid } from "nanoid";
import { EvaBlockView, type EvaBlockOptions } from "./EvaBlockView";
import { defaultBlockData, isEvaBlockType } from "./blockData";
import type { EvaBlockType } from "./types";

function createDefaultBlockData(blockType: EvaBlockType): object {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const EvaBlock = Node.create<EvaBlockOptions>({
  name: "evaBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { docId: undefined };
  },

  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-block-id"),
        renderHTML: (attributes) =>
          attributes.blockId ? { "data-block-id": attributes.blockId } : {},
      },
      blockType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-block-type"),
        renderHTML: (attributes) =>
          attributes.blockType
            ? { "data-block-type": attributes.blockType }
            : {},
      },
      data: {
        default: {},
        parseHTML: (element) => {
          const raw = element.getAttribute("data-block-data");
          if (!raw) return {};
          try {
            const parsed: unknown = JSON.parse(raw);
            return isRecord(parsed) ? parsed : {};
          } catch {
            return {};
          }
        },
        renderHTML: (attributes) => {
          const data = isRecord(attributes.data) ? attributes.data : {};
          return { "data-block-data": JSON.stringify(data) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-eva-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-eva-block": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EvaBlockView);
  },

  addCommands() {
    return {
      insertEvaBlock:
        (blockType: EvaBlockType) =>
        ({ commands, chain }) => {
          if (!isEvaBlockType(blockType)) return false;
          const inserted = commands.insertContent({
            type: this.name,
            attrs: {
              blockId: nanoid(),
              blockType,
              data: createDefaultBlockData(blockType),
            },
          });
          if (!inserted) return false;
          return chain()
            .command(({ tr }) => {
              tr.setMeta(suggestChangesKey, { skip: true });
              return true;
            })
            .run();
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    evaBlock: {
      insertEvaBlock: (blockType: EvaBlockType) => ReturnType;
    };
  }
}
