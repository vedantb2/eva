import { useState, type ReactNode } from "react";
import { Button, cn } from "@eva/ui";

/** Match t3code MessagesTimeline collapsible user prompts. */
const MAX_COLLAPSED_USER_MESSAGE_LINES = 8;
const MAX_COLLAPSED_USER_MESSAGE_LENGTH = 600;
const COLLAPSED_USER_MESSAGE_FADE_HEIGHT_REM = 1.75;
const COLLAPSED_USER_MESSAGE_FADE_MASK = `linear-gradient(to bottom, black calc(100% - ${COLLAPSED_USER_MESSAGE_FADE_HEIGHT_REM}rem), transparent)`;

function shouldCollapseUserMessage(text: string): boolean {
  if (text.trim().length === 0) {
    return false;
  }
  return (
    text.length > MAX_COLLAPSED_USER_MESSAGE_LENGTH ||
    text.split("\n").length > MAX_COLLAPSED_USER_MESSAGE_LINES
  );
}

interface CollapsibleUserMessageBodyProps {
  text: string;
  children: ReactNode;
}

/**
 * Collapses long user prompts behind "Show full message", same thresholds as
 * [t3code](https://github.com/pingdotgg/t3code) MessagesTimeline.
 */
export function CollapsibleUserMessageBody({
  text,
  children,
}: CollapsibleUserMessageBodyProps) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = shouldCollapseUserMessage(text);
  const isCollapsed = canCollapse && !expanded;

  return (
    <div>
      <div
        className={cn("relative", isCollapsed && "max-h-44 overflow-hidden")}
        data-user-message-collapsed={isCollapsed ? "true" : "false"}
        data-user-message-collapsible={canCollapse ? "true" : "false"}
        style={
          isCollapsed
            ? {
                WebkitMaskImage: COLLAPSED_USER_MESSAGE_FADE_MASK,
                maskImage: COLLAPSED_USER_MESSAGE_FADE_MASK,
              }
            : undefined
        }
      >
        {children}
      </div>
      {canCollapse ? (
        <div className="mt-1.5 flex items-center justify-start">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="-ml-1.5 h-6 rounded-md px-1.5 text-xs font-normal text-subtle-foreground hover:bg-muted/55 hover:text-foreground/85"
          >
            {expanded ? "Show less" : "Show full message"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
