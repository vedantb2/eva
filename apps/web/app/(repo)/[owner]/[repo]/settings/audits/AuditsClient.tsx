"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, Checkbox } from "@conductor/ui";
import { IconTrash } from "@tabler/icons-react";
import type { Id } from "@conductor/backend/convex/_generated/dataModel";
import { AddCategoryForm } from "./_components/AddCategoryForm";

export function AuditsClient() {
  const { repoId } = useRepo();
  const categories = useQuery(api.auditCategories.listByRepo, { repoId });
  const seedDefaults = useMutation(api.auditCategories.seedDefaults);
  const toggleEnabled = useMutation(api.auditCategories.toggleEnabled);
  const removeCategory = useMutation(api.auditCategories.remove);

  if (!categories) return null;

  const hasCategories = categories.length > 0;

  return (
    <PageWrapper title="Audits">
      <div className="space-y-4">
        <div className="rounded-lg border border-border/70 p-3 space-y-4 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Audit Categories</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Configure which audits run after task completion.
              </p>
            </div>
            {!hasCategories && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => seedDefaults({ repoId })}
              >
                Get defaults
              </Button>
            )}
          </div>

          {hasCategories && (
            <div className="grid gap-2">
              {categories.map((category) => (
                <CategoryRow
                  key={category._id}
                  id={category._id}
                  name={category.name}
                  description={category.description}
                  enabled={category.enabled}
                  isSystem={category.isSystem}
                  onToggle={(enabled) =>
                    toggleEnabled({ id: category._id, enabled })
                  }
                  onRemove={() => removeCategory({ id: category._id })}
                />
              ))}
            </div>
          )}

          {!hasCategories && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No audit categories configured. Click &quot;Get defaults&quot; to
              add the standard set.
            </p>
          )}
        </div>

        {hasCategories && (
          <div className="rounded-lg border border-border/70 p-3 space-y-4 sm:p-4">
            <h3 className="text-sm font-medium">Add Custom Category</h3>
            <AddCategoryForm repoId={repoId} />
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function CategoryRow(props: {
  id: Id<"auditCategories">;
  name: string;
  description: string;
  enabled: boolean;
  isSystem: boolean;
  onToggle: (enabled: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border/50 p-3">
      <Checkbox
        checked={props.enabled}
        onCheckedChange={(checked) => props.onToggle(checked === true)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">{props.name}</p>
          {props.isSystem && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              System
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
          {props.description}
        </p>
      </div>
      {!props.isSystem && (
        <button
          onClick={props.onRemove}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <IconTrash size={14} />
        </button>
      )}
    </div>
  );
}
