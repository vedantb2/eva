"use client";

import { type api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { Button, Checkbox } from "@eva/ui";
import { IconTrash } from "@tabler/icons-react";

type Category = FunctionReturnType<typeof api.auditCategories.listByRepo>[number];

export function CategoryRow({
  category,
  onToggle,
  onRemove,
}: {
  category: Category;
  onToggle: (enabled: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <Checkbox
        checked={category.enabled}
        onCheckedChange={(value) => onToggle(value === true)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{category.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {category.description}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={`Remove ${category.name}`}
        onClick={onRemove}
      >
        <IconTrash size={14} />
      </Button>
    </div>
  );
}
