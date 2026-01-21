import { useState } from "react";
import type { ExtractedContext, ReactComponentNode } from "@/shared/types";

interface ContextPreviewProps {
  context: ExtractedContext;
  onClear: () => void;
}

function ComponentTree({
  node,
  expanded,
}: {
  node: ReactComponentNode;
  expanded: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(expanded && node.depth < 2);
  const hasChildren = node.children.length > 0;

  const typeColors: Record<string, string> = {
    component: "text-blue-400",
    element: "text-green-400",
    fragment: "text-purple-400",
    text: "text-slate-400",
  };

  return (
    <div className="font-mono text-xs">
      <div
        className={`flex items-center gap-1 py-0.5 hover:bg-slate-700 rounded cursor-pointer ${hasChildren ? "" : "pl-4"}`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ paddingLeft: `${node.depth * 12 + (hasChildren ? 0 : 12)}px` }}
      >
        {hasChildren && (
          <span className="text-slate-500 w-3">
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
        <span className={typeColors[node.type] || "text-slate-300"}>
          {"<"}
          {node.name}
          {node.key && (
            <span className="text-yellow-400"> key=&quot;{node.key}&quot;</span>
          )}
          {Object.keys(node.props).length > 0 && (
            <span className="text-slate-500">
              {" "}
              {Object.keys(node.props).length} props
            </span>
          )}
          {node.hooks.length > 0 && (
            <span className="text-purple-400"> {node.hooks.length} hooks</span>
          )}
          {">"}
        </span>
      </div>

      {isExpanded &&
        node.children.map((child, i) => (
          <ComponentTree key={i} node={child} expanded={false} />
        ))}
    </div>
  );
}

export function ContextPreview({ context, onClear }: ContextPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mx-4 mt-3 bg-slate-800 rounded-lg border border-slate-600 overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">
            {isExpanded ? "▼" : "▶"}
          </span>
          <span className="text-sm text-slate-300">
            Captured: <span className="text-blue-400">{context.tree.name}</span>
          </span>
          <span className="text-xs text-slate-500">
            ({context.metadata.totalComponents} components)
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-slate-500 hover:text-white p-1"
          title="Clear context"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-700 p-2 max-h-48 overflow-y-auto">
          <ComponentTree node={context.tree} expanded={true} />
        </div>
      )}
    </div>
  );
}
