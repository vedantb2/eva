"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Button,
  Input,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { IconSearch, IconX } from "@tabler/icons-react";

interface ToggleSearchProps {
  value: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  tooltipLabel?: string;
  visible?: boolean;
}

export function ToggleSearch({
  value,
  onChange,
  placeholder = "Search...",
  tooltipLabel = "Search",
  visible = true,
}: ToggleSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const showInput = isOpen || !!value;

  if (!visible) return null;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {showInput ? (
        <motion.div
          key="toggle-search-input"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="relative w-28 sm:w-32 md:w-44">
            <IconSearch
              size={14}
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
              className="h-8 pl-7 pr-7 text-sm"
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <IconX size={13} />
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
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
                <IconSearch size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tooltipLabel}</TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
