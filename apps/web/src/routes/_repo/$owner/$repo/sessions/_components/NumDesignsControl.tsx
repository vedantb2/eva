"use client";

const DESIGN_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;

interface NumDesignsControlProps {
  value: number;
  onChange: (count: number) => void;
  disabled?: boolean;
}

/** Compact 1–5 picker for how many design variations to generate. */
export function NumDesignsControl({
  value,
  onChange,
  disabled = false,
}: NumDesignsControlProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Designs:</span>
      {DESIGN_COUNT_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          disabled={disabled}
          className={`h-5 w-5 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
            value === n
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
