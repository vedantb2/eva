"use client";

import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { Card, CardContent, Button, Spinner } from "@conductor/ui";
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
    <Card className="mb-6 overflow-hidden border border-border/70 bg-card shadow-none">
      <CardContent className="p-0">
        <div className="relative p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
              setDismissed(true);
            }}
            className="absolute top-3 right-3 z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <IconX size={16} />
          </Button>
          <div className="flex items-center gap-2 mb-3">
            <IconSparkles size={20} className="text-primary" />
            <p className="text-base font-semibold text-foreground">Meet Eva</p>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Your AI-powered coworker that helps you ship faster. Select a
            repository below to get started.
          </p>
          <div className="flex items-center gap-3 mt-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <f.icon size={14} className="text-primary" />
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
  const syncRepos = useAction(api.github.syncRepos);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncRepos();
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
              className="motion-press border-border text-muted-foreground hover:scale-[1.01] active:scale-[0.99]"
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
            className="motion-press bg-foreground text-background font-medium hover:scale-[1.01] active:scale-[0.99]"
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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary mb-3">
            <IconBrandGithub size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No repositories</p>
          <p className="text-sm text-muted-foreground mt-1">
            Connect a GitHub repository to get started.
          </p>
          <Button
            asChild
            className="mt-4 bg-foreground text-background font-medium"
          >
            <a href={connectUrl}>
              <IconBrandGithub size={16} />
              Connect GitHub
            </a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {repos.map((repo, index) => (
              <motion.div
                key={repo._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.2,
                  delay: Math.min(index * 0.03, 0.2),
                }}
              >
                <Link
                  href={"/" + encodeRepoSlug(repo.owner + "/" + repo.name)}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <Card className="motion-emphasized cursor-pointer bg-secondary shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-sm">
                    <CardContent className="gap-3 p-3">
                      <IconBrandGithub
                        size={20}
                        className="text-muted-foreground"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {repo.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {repo.owner}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  );
}
