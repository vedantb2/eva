import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@eva/ui";

const DESIGN_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;

type DesignCount = (typeof DESIGN_COUNT_OPTIONS)[number];

function isDesignCount(value: string): value is `${DesignCount}` {
  return DESIGN_COUNT_OPTIONS.some((n) => String(n) === value);
}

interface NumDesignsControlProps {
  value: number;
  onChange: (count: number) => void;
  disabled?: boolean;
}

/** Dropdown for how many design variations to generate (1–5). */
export function NumDesignsControl({
  value,
  onChange,
  disabled = false,
}: NumDesignsControlProps) {
  const selected =
    DESIGN_COUNT_OPTIONS.find((n) => n === value) ?? DESIGN_COUNT_OPTIONS[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          Designs: {selected}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Design count</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(selected)}
          onValueChange={(next) => {
            if (isDesignCount(next)) {
              onChange(Number(next));
            }
          }}
        >
          {DESIGN_COUNT_OPTIONS.map((n) => (
            <DropdownMenuRadioItem key={n} value={String(n)}>
              {n}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
