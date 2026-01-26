import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm overflow-hidden",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>span]:line-clamp-1"
        )}
        aria-expanded={isOpen}
      >
        <span className={cn("truncate min-w-0", !selectedOption && "text-muted-foreground")}>
          {selectedOption?.label || placeholder}
        </span>
        <IconChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-neutral-200 dark:bg-neutral-800 shadow-md"
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No options
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                    "hover:bg-primary/10 hover:text-primary",
                    "focus:bg-primary/10 focus:text-primary",
                    option.value === value && "bg-primary/10 text-primary"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      <IconCheck className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
