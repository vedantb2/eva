"use client";

import {
  Button,
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
        <Button type="button" variant="ghost" size="xs">
          Designs: {selected}
        </Button>
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
