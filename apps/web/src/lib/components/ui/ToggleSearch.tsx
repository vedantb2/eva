"use client";

import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import {
  Button,
  Input,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  cn,
} from "@eva/ui";
import { IconSearch, IconX } from "@tabler/icons-react";

// "compact" is the small toolbar pill; "large" is the taller, wider,
// rounded-and-shadowed bar used on the quick-tasks page.
type ToggleSearchVariant = "compact" | "large";

interface ToggleSearchProps {
  value: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  tooltipLabel?: string;
  visible?: boolean;
  variant?: ToggleSearchVariant;
}

export function ToggleSearch({
  value,
  onChange,
  placeholder = "Search...",
  tooltipLabel = "Search",
  visible = true,
  variant = "compact",
}: ToggleSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const showInput = isOpen || !!value;
  const isLarge = variant === "large";

  if (!visible) return null;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {showInput ? (
        <m.div
          key="toggle-search-input"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "relative",
              isLarge ? "w-56 sm:w-64 md:w-80" : "w-28 sm:w-32 md:w-44",
            )}
          >
            <IconSearch
              size={isLarge ? 16 : 14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value || null)}
              onBlur={() => {
                if (!value) setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onChange(null);
                  setIsOpen(false);
                }
              }}
              // No focus-visible overrides: Input already ships a real ring
              // (`ring-2 ring-ring/35`). This used to cancel it with `ring-0`
              // and substitute a shadow, which is invisible on a dark canvas.
              className={cn(
                isLarge
                  ? "h-9 rounded-control pl-9 pr-8 text-sm shadow-sm"
                  : "h-8 pl-7 pr-7 text-sm",
              )}
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
                  isLarge ? "right-3" : "right-2",
                )}
              >
                <IconX size={isLarge ? 15 : 13} />
              </button>
            )}
          </div>
        </m.div>
      ) : (
        <m.div
          key="toggle-search-icon"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.96]"
                onClick={() => setIsOpen(true)}
              >
                <IconSearch className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tooltipLabel}</TooltipContent>
          </Tooltip>
        </m.div>
      )}
    </AnimatePresence>
  );
}
