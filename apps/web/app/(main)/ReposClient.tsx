"use client";

import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
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
  IconLayoutKanban,
  IconTerminal2,
  IconCode,
  IconFileText,
  IconPlugConnectedX,
} from "@tabler/icons-react";

const GITHUB_APP_NAME = "v-conductor-dev";
const WELCOME_DISMISSED_KEY = "eva-welcome-dismissed";

const PLATFORM_SECTIONS = [
  {
    icon: IconLayoutKanban,
    label: "Projects",
    shortDesc: "Autonomous feature builder",
    longDesc:
      "Eva plans and executes large features end-to-end — tasks, PRs, and reviews — without interrupting your flow.",
  },
  {
    icon: IconTerminal2,
    label: "Sessions",
    shortDesc: "Interactive pair programming",
    longDesc:
      "Chat with Eva in real time to iterate on ideas, debug issues, and ship incremental changes fast.",
  },
  {
    icon: IconCode,
    label: "Quick Tasks",
    shortDesc: "Small fixes & changes",
    longDesc:
      "Ship one-off fixes and small changes without spinning up a full project or session.",
  },
  {
    icon: IconFileText,
    label: "Documents",
    shortDesc: "AI-assisted docs",
    longDesc:
      "Generate and maintain specs, PRDs, and runbooks — kept in sync with your actual codebase.",
  },
];

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="ui-surface-strong mb-6 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-primary/10">
                  <IconSparkles size={14} className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Getting started with Eva
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onDismiss}
                className="-mr-1 h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <IconX size={14} />
              </Button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Select a repository below to access Eva's tools for planning,
              coding, and shipping.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLATFORM_SECTIONS.map((section) => (
                <div
                  key={section.label}
                  className="flex flex-col gap-1.5 rounded-lg border border-border/50 bg-secondary/40 p-2.5"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <section.icon size={13} className="text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {section.label}
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {section.shortDesc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyOnboarding({ connectUrl }: { connectUrl: string }) {
  const steps = [
    { num: 1, label: "Connect GitHub", active: true },
    { num: 2, label: "Select a repo", active: false },
    { num: 3, label: "Start building", active: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center px-4 py-12"
    >
      {/* Step indicator */}
      <div className="mb-12 flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                step.active
                  ? "bg-primary text-background shadow-sm ring-2 ring-primary/25 ring-offset-1 ring-offset-background"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step.num}
            </div>
            <span
              className={`whitespace-nowrap text-xs ${
                step.active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 h-px w-8 flex-shrink-0 ${
                  i === 0
                    ? "bg-gradient-to-r from-primary/40 to-border"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="mb-10 flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute h-20 w-20 rounded-full bg-primary/10 blur-xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-card/95 shadow-md ring-1 ring-primary/15">
            <IconBrandGithub size={26} className="text-primary" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
          Connect your GitHub
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Link your repositories to unlock Eva's AI tools for planning, coding,
          and shipping features autonomously.
        </p>
        <Button
          asChild
          className="bg-foreground px-6 font-medium text-background hover:scale-[1.01] active:scale-[0.99]"
        >
          <a href={connectUrl}>
            <IconBrandGithub size={16} />
            Connect GitHub
          </a>
        </Button>
      </div>

      {/* Feature preview */}
      <div className="w-full max-w-lg">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          What you&apos;ll get access to
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PLATFORM_SECTIONS.map((section, index) => (
            <motion.div
              key={section.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 + index * 0.06 }}
            >
              <Card className="ui-surface-strong h-full overflow-hidden">
                <div className="h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
                <CardContent className="p-3">
                  <section.icon size={16} className="mb-2 text-primary" />
                  <p className="text-xs font-medium text-foreground">
                    {section.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {section.longDesc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ReposClient() {
  const repos = useQuery(api.githubRepos.list);
  const syncRepos = useAction(api.github.syncRepos);
  const [syncing, setSyncing] = useState(false);
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
                    <Card className="motion-emphasized ui-surface-interactive cursor-pointer">
                      <CardContent className="gap-3 p-3">
                        <IconBrandGithub
                          size={20}
                          className={
                            repo.connected === false
                              ? "text-destructive/60"
                              : "text-muted-foreground"
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {repo.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {repo.owner}
                          </p>
                        </div>
                        {repo.connected === false && (
                          <div className="flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive">
                            <IconPlugConnectedX size={11} />
                            <span className="text-[11px] font-medium">
                              Disconnected
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
