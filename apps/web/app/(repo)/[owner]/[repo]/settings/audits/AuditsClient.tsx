"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Checkbox } from "@conductor/ui";
import { IconTrash } from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { AddCategoryForm } from "./_components/AddCategoryForm";

type Category = FunctionReturnType<
  typeof api.auditCategories.listByRepo
>[number];

export function AuditsClient() {
  const { repo, repoId } = useRepo();
  const categories = useQuery(api.auditCategories.listByRepo, { repoId });
  const toggleEnabled = useMutation(api.auditCategories.toggleEnabled);
  const toggleDisabledForApp = useMutation(
    api.auditCategories.toggleDisabledForApp,
  );
  const removeCategory = useMutation(api.auditCategories.remove);

  if (!categories) return null;

  const repoCategories = categories.filter((c) => c.appId === undefined);
  const isApp = repo.parentRepoId !== undefined;
  const appCategories = isApp
    ? categories.filter((c) => c.appId === repoId)
    : [];

  return (
    <PageWrapper title="Audits">
      <div className="space-y-6">
        <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
          <div>
            <h3 className="text-sm font-medium">Repo-level Audits</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              These audits run for all tasks across the repo
              {isApp ? " and are inherited by this app." : "."}
            </p>
          </div>

          {repoCategories.length > 0 && (
            <div className="grid gap-2">
              {repoCategories.map((category) =>
                isApp ? (
                  <CategoryRow
                    key={category._id}
                    category={category}
                    isInherited
                    appId={repoId}
                    onToggle={(disabled) =>
                      toggleDisabledForApp({
                        id: category._id,
                        appId: repoId,
                        disabled,
                      })
                    }
                  />
                ) : (
                  <CategoryRow
                    key={category._id}
                    category={category}
                    onToggle={(enabled) =>
                      toggleEnabled({ id: category._id, enabled })
                    }
                    onRemove={() => removeCategory({ id: category._id })}
                  />
                ),
              )}
            </div>
          )}

          {repoCategories.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No audit categories configured yet.
            </p>
          )}

          <AddCategoryForm repoId={repo.parentRepoId ?? repoId} />
        </div>

        {isApp && (
          <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
            <div>
              <h3 className="text-sm font-medium">App-specific Audits</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Audits that only run for this app.
              </p>
            </div>

            {appCategories.length > 0 && (
              <div className="grid gap-2">
                {appCategories.map((category) => (
                  <CategoryRow
                    key={category._id}
                    category={category}
                    onToggle={(enabled) =>
                      toggleEnabled({ id: category._id, enabled })
                    }
                    onRemove={() => removeCategory({ id: category._id })}
                  />
                ))}
              </div>
            )}

            <AddCategoryForm repoId={repoId} appId={repoId} />
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

type CategoryRowProps =
  | {
      isInherited: true;
      category: Category;
      appId: Id<"githubRepos">;
      onToggle: (disabled: boolean) => void;
      onRemove?: never;
    }
  | {
      isInherited?: false;
      category: Category;
      onToggle: (enabled: boolean) => void;
      onRemove: () => void;
      appId?: never;
    };

function CategoryRow(props: CategoryRowProps) {
  const isDisabled = props.isInherited
    ? (props.category.disabledForAppIds?.includes(props.appId) ?? false)
    : false;
  const checked = props.isInherited ? !isDisabled : props.category.enabled;

  return (
    <div className="flex items-start gap-3 rounded-md bg-muted/40 p-3">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) =>
          props.isInherited
            ? props.onToggle(value !== true)
            : props.onToggle(value === true)
        }
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{props.category.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
          {props.category.description}
        </p>
      </div>
      {!props.isInherited && (
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
