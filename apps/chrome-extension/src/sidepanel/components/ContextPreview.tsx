import { useState } from "react";
import type { ExtractedContext } from "@/shared/types";
import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@conductor/ui";
import { IconX } from "@tabler/icons-react";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.min.css";

hljs.registerLanguage("xml", xml);

interface ContextPreviewProps {
  context: ExtractedContext;
  onClear: () => void;
}

export function ContextPreview({ context, onClear }: ContextPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasReact = context.metadata.hasReact && context.react;
  const displayName = context.selectedText
    ? `"${context.selectedText.slice(0, 40)}${context.selectedText.length > 40 ? "..." : ""}"`
    : hasReact && context.react
      ? context.react.name
      : `<${context.element.tagName}>${context.element.id ? `#${context.element.id}` : ""}`;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="bg-muted rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 flex-1">
              <span className="text-muted-foreground text-sm">
                {isExpanded ? "▼" : "▶"}
              </span>
              <span className="text-sm text-foreground">
                Captured: <span className="text-primary">{displayName}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {context.selectedText
                  ? "(text selection)"
                  : hasReact
                    ? `(${context.metadata.totalComponents} components)`
                    : "(HTML element)"}
              </span>
            </div>
          </CollapsibleTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onClear}>
                <IconX size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear context</TooltipContent>
          </Tooltip>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border p-2 max-h-48 overflow-y-auto">
            {context.selectedText ? (
              <p className="text-sm italic text-muted-foreground px-1">
                &ldquo;{context.selectedText}&rdquo;
              </p>
            ) : (
              <pre className="rounded bg-[#0d1117] p-0.5 overflow-auto">
                <code
                  className="hljs text-xs"
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(context.element.outerHTML, {
                      language: "xml",
                    }).value,
                  }}
                />
              </pre>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
