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
    component: "text-blue-500 dark:text-blue-400",
    element: "text-green-600 dark:text-green-400",
    fragment: "text-purple-600 dark:text-purple-400",
    text: "text-muted-foreground",
  };

  return (
    <div className="font-mono text-xs">
      <div
        className={`flex items-center gap-1 py-0.5 hover:bg-muted rounded cursor-pointer ${hasChildren ? "" : "pl-4"}`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ paddingLeft: `${node.depth * 12 + (hasChildren ? 0 : 12)}px` }}
      >
        {hasChildren && (
          <span className="text-muted-foreground w-3">
            {isExpanded ? "▼" : "▶"}
          </span>
        )}
        <span className={typeColors[node.type] || "text-foreground"}>
          {"<"}
          {node.name}
          {node.key && (
            <span className="text-yellow-600 dark:text-yellow-400"> key=&quot;{node.key}&quot;</span>
          )}
          {Object.keys(node.props).length > 0 && (
            <span className="text-muted-foreground">
              {" "}
              {Object.keys(node.props).length} props
            </span>
          )}
          {node.hooks.length > 0 && (
            <span className="text-purple-600 dark:text-purple-400"> {node.hooks.length} hooks</span>
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

function ElementInfoView({ context }: { context: ExtractedContext }) {
  const { element } = context;

  return (
    <div className="font-mono text-xs space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-green-600 dark:text-green-400">&lt;{element.tagName}&gt;</span>
        {element.id && <span className="text-yellow-600 dark:text-yellow-400">#{element.id}</span>}
      </div>
      {element.classNames.length > 0 && (
        <div className="text-muted-foreground">
          .{element.classNames.slice(0, 3).join(" .")}
          {element.classNames.length > 3 && ` +${element.classNames.length - 3} more`}
        </div>
      )}
      <div className="text-muted-foreground truncate">
        {element.textContent.slice(0, 100) || "(no text)"}
      </div>
      <div className="text-muted-foreground/70 text-[10px]">
        {Math.round(element.boundingRect.width)}×{Math.round(element.boundingRect.height)}px
      </div>
    </div>
  );
}

export function ContextPreview({ context, onClear }: ContextPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasReact = context.metadata.hasReact && context.react;
  const displayName = hasReact && context.react
    ? context.react.name
    : `<${context.element.tagName}>${context.element.id ? `#${context.element.id}` : ""}`;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {isExpanded ? "▼" : "▶"}
          </span>
          <span className="text-sm text-foreground">
            Captured: <span className="text-blue-600 dark:text-blue-400">{displayName}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {hasReact
              ? `(${context.metadata.totalComponents} components)`
              : "(HTML element)"}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-muted-foreground hover:text-foreground p-1"
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
        <div className="border-t border-border p-2 max-h-48 overflow-y-auto">
          {hasReact && context.react ? (
            <ComponentTree node={context.react} expanded={true} />
          ) : (
            <ElementInfoView context={context} />
          )}
        </div>
      )}
    </div>
  );
}
