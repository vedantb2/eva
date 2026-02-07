"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "@/api";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Button, Spinner } from "@conductor/ui";
import {
  IconBrandGithub,
  IconPlus,
  IconRefresh,
  IconX,
  IconSparkles,
  IconCode,
  IconListCheck,
  IconGitBranch,
} from "@tabler/icons-react";
import { syncGitHubRepos } from "./actions";

const GITHUB_APP_NAME = "v-conductor-dev";
const WELCOME_DISMISSED_KEY = "eva-welcome-dismissed";

function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(WELCOME_DISMISSED_KEY) === "true");
  }, []);

  if (dismissed) return null;

  const features = [
    { icon: IconCode, label: "Write code" },
    { icon: IconListCheck, label: "Plan features" },
    { icon: IconGitBranch, label: "Manage repos" },
  ];

  return (
    <Card className="mb-6 overflow-hidden shadow-none bg-gradient-to-br from-primary/80 to-primary/90">
      <CardContent className="p-0">
        <div className="relative p-5 sm:p-6">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
              setDismissed(true);
            }}
            className="absolute top-3 right-3 text-neutral-400 hover:text-white z-10 h-8 w-8"
          >
            <IconX size={16} />
          </Button>
          <div className="flex items-center gap-2 mb-3">
            <IconSparkles size={20} className="text-white/80" />
            <p className="text-lg font-semibold text-white">Meet Eva</p>
          </div>
          <p className="text-sm text-primary-foreground/80 max-w-md">
            Your AI-powered coworker that helps you ship faster. Select a
            repository below to get started.
          </p>
          <div className="flex items-center gap-4 mt-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 text-xs text-primary-foreground/70"
              >
                <f.icon size={14} className="text-white/80" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReposClient() {
  const repos = useQuery(api.githubRepos.list);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncGitHubRepos();
    } catch (err) {
      console.error("Sync failed:", err);
    }
    setSyncing(false);
  };

  const connectUrl =
    "https://github.com/apps/" + GITHUB_APP_NAME + "/installations/new";
  const configureUrl = "https://github.com/settings/installations";

  const hasRepos = repos && repos.length > 0;

  return (
    <PageWrapper
      title="Repositories"
      headerRight={
        <div className="flex items-center gap-2">
          {hasRepos && (
            <Button
              size="sm"
              variant="outline"
              disabled={syncing}
              onClick={handleSync}
              className="text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
            >
              <IconRefresh
                size={16}
                className={syncing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Sync</span>
            </Button>
          )}
          <Button
            size="sm"
            asChild
            className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium"
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
      <WelcomeBanner />
      {repos === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="md" />
        </div>
      ) : repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
            <IconBrandGithub size={24} className="text-neutral-400" />
          </div>
          <p className="text-base font-medium text-neutral-900 dark:text-white">
            No repositories
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Connect a GitHub repository to get started.
          </p>
          <Button
            asChild
            className="mt-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium"
          >
            <a href={connectUrl}>
              <IconBrandGithub size={16} />
              Connect GitHub
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <Link
              key={repo._id}
              href={"/" + encodeRepoSlug(repo.owner + "/" + repo.name)}
            >
              <Card className="shadow-none cursor-pointer bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <CardContent className="p-4 gap-3">
                  <IconBrandGithub
                    size={20}
                    className="text-neutral-400 dark:text-neutral-500"
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-neutral-900 dark:text-white truncate">
                      {repo.name}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {repo.owner}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
