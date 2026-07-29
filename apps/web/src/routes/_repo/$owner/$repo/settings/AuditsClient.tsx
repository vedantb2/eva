"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, Checkbox } from "@eva/ui";
import { IconShieldCheck, IconTrash } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import { AddCategoryForm } from "./audits/_components/AddCategoryForm";
import { isAppRepo } from "./_utils";

type Category = FunctionReturnType<
  typeof api.auditCategories.listByRepo
>[number];

export function AuditsClient() {
  const { repo, repoId } = useRepo();
  const categories = useQuery(api.auditCategories.listByRepo, { repoId });
  const toggleEnabled = useMutation(
    api.auditCategories.toggleEnabled,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.auditCategories.listByRepo, {
      repoId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.auditCategories.listByRepo,
        { repoId },
        current.map((c) =>
          c._id === args.id ? { ...c, enabled: args.enabled } : c,
        ),
      );
    }
  });
  const removeCategory = useMutation(
    api.auditCategories.remove,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.auditCategories.listByRepo, {
      repoId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.auditCategories.listByRepo,
        { repoId },
        current.filter((c) => c._id !== args.id),
      );
    }
  });

  if (!categories) return null;

  const repoCategories = categories.filter((c) => c.appId === undefined);
  const isApp = isAppRepo(repo);
  const appCategories = isApp
    ? categories.filter((c) => c.appId === repoId)
    : [];

  return (
    <PageWrapper title="Audits" comfortable>
      <div className="space-y-4">
        {/* Each scope is one list section plus its own add form, so it is
            always clear which scope a new category lands in. */}
        <SettingsSection
          title="Repo-level Audits"
          description="These audits run for all tasks across the repo and all apps."
          // Rows own their padding so the divider spans the card's full width.
          bodyClassName="p-0"
        >
          {repoCategories.length > 0 ? (
            <div className="divide-y divide-border">
              {repoCategories.map((category) => (
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
          ) : (
            <SettingsEmptyState
              icon={IconShieldCheck}
              title="No audit categories yet"
              description="Add one below to have every task audited against it."
            />
          )}
        </SettingsSection>

        <SettingsSection title="Add a repo-level audit">
          <AddCategoryForm repoId={repo.parentRepoId ?? repoId} />
        </SettingsSection>

        {isApp && (
          <>
            <SettingsSection
              title="App-specific Audits"
              description="Audits that only run for this app."
              bodyClassName="p-0"
            >
              {appCategories.length > 0 ? (
                <div className="divide-y divide-border">
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
              ) : (
                <SettingsEmptyState
                  icon={IconShieldCheck}
                  title="No app-specific audits"
                  description="This app runs the repo-level audits only."
                />
              )}
            </SettingsSection>

            <SettingsSection title="Add an app-specific audit">
              <AddCategoryForm repoId={repoId} appId={repoId} />
            </SettingsSection>
          </>
        )}
      </div>
    </PageWrapper>
  );
}

function CategoryRow({
  category,
  onToggle,
  onRemove,
}: {
  category: Category;
  onToggle: (enabled: boolean) => void;
  onRemove: () => void;
}) {
  return (
    // A row inside the audits list section, so the section owns the border.
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
