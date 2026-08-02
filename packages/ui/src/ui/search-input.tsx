import { IconSearch } from "@tabler/icons-react";
import { ClearInput } from "./clear-input";
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
    <ClearInput
      value={value}
      onChange={(next) => {
        onChange(next);
        if (next.length === 0) {
          onClear();
        }
      }}
      placeholder={placeholder}
      wrapperClassName={cn("w-full max-w-sm", className)}
      className={cn("h-9 pl-8 text-sm", inputClassName)}
      leading={
        <IconSearch
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 z-[3] -translate-y-1/2 text-muted-foreground"
        />
      }
    />
  );
}

export { SearchInput };
export type { SearchInputProps };
