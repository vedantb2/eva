"use client";

import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { api } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { repoHref } from "@/lib/utils/repoUrl";
import {
  Button,
  Spinner,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@conductor/ui";
import {
  IconDots,
  IconEyeOff,
  IconPlus,
  IconRefresh,
  IconSettings,
} from "@tabler/icons-react";
import { WelcomeBanner } from "./_components/WelcomeBanner";
import { EmptyOnboarding } from "./_components/EmptyOnboarding";
import { RepoGroup } from "./_components/RepoGroup";
import { HiddenReposSheet } from "./_components/HiddenReposSheet";

const GITHUB_APP_NAME = "vb-eva-dev";
const WELCOME_DISMISSED_KEY = "eva-welcome-dismissed";

export function ReposClient() {
  const router = useRouter();
  const repos = useQuery(api.githubRepos.list, {});
  const teams = useQuery(api.teams.list) ?? [];
  const syncRepos = useAction(api.github.syncRepos);
  const [syncing, setSyncing] = useState(false);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);

  useEffect(() => {
    setWelcomeDismissed(localStorage.getItem(WELCOME_DISMISSED_KEY) === "true");
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncRepos();
    } catch (err) {
      console.error("Sync failed:", err);
    }
    setSyncing(false);
  };

  const handleDismissWelcome = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    setWelcomeDismissed(true);
  };

  const connectUrl =
    "https://github.com/apps/" + GITHUB_APP_NAME + "/installations/new";
  const configureUrl = "https://github.com/settings/installations";

  const hasRepos = repos && repos.length > 0;

  const groupedRepos = repos
    ? repos.reduce<Record<string, typeof repos>>((groups, repo) => {
        const team = repo.teamId
          ? teams.find((t) => t._id === repo.teamId)
          : undefined;
        const groupKey = team ? (team.displayName ?? team.name) : "My Team";
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(repo);
        return groups;
      }, {})
    : {};

  const groupNames = Object.keys(groupedRepos).sort((a, b) => {
    if (a === "My Team") return -1;
    if (b === "My Team") return 1;
    return a.localeCompare(b);
  });

  return (
    <PageWrapper
      title="Codebases"
      headerRight={
        <div className="flex items-center gap-2">
          {hasRepos && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="motion-press border-border text-muted-foreground hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <IconDots size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push("/settings/sync")}
                  >
                    <IconSettings size={16} />
                    Sync Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHiddenOpen(true)}>
                    <IconEyeOff size={16} />
                    Hidden Codebases
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={syncing}
                    onClick={() => setSyncConfirmOpen(true)}
                  >
                    <IconRefresh
                      size={16}
                      className={syncing ? "animate-spin" : ""}
                    />
                    {syncing ? "Syncing..." : "Sync Repos"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <HiddenReposSheet
                open={hiddenOpen}
                onOpenChange={setHiddenOpen}
              />
              <Dialog open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sync Repos</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    This will re-sync all repositories from GitHub. Continue?
                  </p>
                  <DialogFooter>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSyncConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={syncing}
                      onClick={() => {
                        setSyncConfirmOpen(false);
                        handleSync();
                      }}
                    >
                      <IconRefresh
                        size={16}
                        className={syncing ? "animate-spin" : ""}
                      />
                      Sync
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Button
            size="sm"
            asChild
            className="motion-press bg-foreground font-medium text-background hover:scale-[1.01] active:scale-[0.99]"
          >
            <a
              href={hasRepos ? configureUrl : connectUrl}
              target={hasRepos ? "_blank" : undefined}
              rel={hasRepos ? "noopener noreferrer" : undefined}
            >
              <IconPlus size={16} />
              <span className="hidden sm:inline">
                {hasRepos ? "Add Repos" : "Connect GitHub"}
              </span>
            </a>
          </Button>
        </div>
      }
    >
      {repos === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="md" />
        </div>
      ) : repos.length === 0 ? (
        <EmptyOnboarding connectUrl={connectUrl} />
      ) : (
        <>
          <AnimatePresence>
            {!welcomeDismissed && (
              <WelcomeBanner onDismiss={handleDismissWelcome} />
            )}
          </AnimatePresence>
          <div className="space-y-6">
            {groupNames.map((groupName) => (
              <RepoGroup
                key={groupName}
                groupName={groupName}
                repos={groupedRepos[groupName]}
                onManageApps={(repo) =>
                  router.push(
                    repoHref(repo.owner, repo.name, repo.rootDirectory) +
                      "/settings/monorepo",
                  )
                }
              />
            ))}
          </div>
        </>
      )}
    </PageWrapper>
  );
}
