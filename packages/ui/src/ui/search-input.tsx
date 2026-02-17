import { IconSearch, IconX } from "@tabler/icons-react";
import { Input } from "./input";
import { cn } from "../utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className,
  inputClassName,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full max-w-xs", className)}>
      <IconSearch
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        placeholder={placeholder}
        className={cn("h-8 pl-8 pr-8 text-sm", inputClassName)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="motion-press absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:scale-105 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

export { SearchInput };
export type { SearchInputProps };
