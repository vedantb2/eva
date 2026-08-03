"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { IconShieldCheck } from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import { AddCategoryForm } from "./audits/_components/AddCategoryForm";
import { CategoryRow } from "./audits/_components/CategoryRow";
import { isAppRepo } from "./_utils";

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
    <SettingsPage title="Audits">
      <SettingsSection
        title="Repo audits"
        description="Run on every task across this repo."
        bodyVariant="list"
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
            title="No repo audits"
            description="Add one below to check every task against it."
          />
        )}
        <div className="border-t border-border px-4 py-3">
          <AddCategoryForm repoId={repo.parentRepoId ?? repoId} />
        </div>
      </SettingsSection>

      {isApp ? (
        <SettingsSection
          title="App audits"
          description="Only for this app."
          bodyVariant="list"
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
              title="No app audits"
              description="This app only runs the repo audits above."
            />
          )}
          <div className="border-t border-border px-4 py-3">
            <AddCategoryForm repoId={repoId} appId={repoId} />
          </div>
        </SettingsSection>
      ) : null}
    </SettingsPage>
  );
}
