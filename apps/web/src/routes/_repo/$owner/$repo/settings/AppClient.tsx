"use client";

import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Input } from "@conductor/ui";
import { parseCommandLines } from "./_utils";
import { LogoSettingsSection } from "./_components/LogoSettingsSection";

export function AppClient() {
  const { repo, repoId, owner, name } = useRepo();
  const appName = repo.rootDirectory?.split("/").pop();
  const updateConfig = useMutation(
    api.githubRepos.updateConfig,
  ).withOptimisticUpdate((localStore, args) => {
    const queryArgs = { owner, name, appName };
    const current = localStore.getQuery(
      api.githubRepos.getByOwnerAndName,
      queryArgs,
    );
    if (current !== undefined && current !== null) {
      const { repoId: _id, devPort, ...safeFields } = args;
      localStore.setQuery(api.githubRepos.getByOwnerAndName, queryArgs, {
        ...current,
        ...safeFields,
        ...(devPort !== undefined ? { devPort: devPort ?? undefined } : {}),
      });
    }
  });

  const startupCommands = repo.startupCommands?.join("\n") ?? "";
  const backgroundCommands = repo.backgroundCommands?.join("\n") ?? "";
  const stopCommands = repo.stopCommands?.join("\n") ?? "";

  const handleDevPortBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    // Empty input clears the override (null sentinel) so detection takes over.
    if (raw === "") {
      if (repo.devPort !== undefined) {
        updateConfig({ repoId, devPort: null });
      }
      return;
    }
    const port = parseInt(raw, 10);
    if (Number.isNaN(port) || port <= 0 || port > 65535) return;
    if (port === repo.devPort) return;
    updateConfig({ repoId, devPort: port });
  };

  const handleDevCommandBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (next === (repo.devCommand ?? "")) return;
    // Empty string clears the override on the backend.
    updateConfig({ repoId, devCommand: next });
  };

  const handleStartupCommandsBlur = (
    e: React.FocusEvent<HTMLTextAreaElement>,
  ) => {
    const next = e.target.value;
    if (next === startupCommands) return;
    updateConfig({ repoId, startupCommands: parseCommandLines(next) });
  };

  const handleBackgroundCommandsBlur = (
    e: React.FocusEvent<HTMLTextAreaElement>,
  ) => {
    const next = e.target.value;
    if (next === backgroundCommands) return;
    updateConfig({ repoId, backgroundCommands: parseCommandLines(next) });
  };

  const handleStopCommandsBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (next === stopCommands) return;
    updateConfig({ repoId, stopCommands: parseCommandLines(next) });
  };

  const handleSystemPromptBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (next === (repo.systemPrompt ?? "")) return;
    updateConfig({ repoId, systemPrompt: next });
  };

  return (
    <PageWrapper title="App" comfortable>
      <div className="space-y-4">
        <LogoSettingsSection repoId={repoId} />

        <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
          <div>
            <h3 className="text-sm font-medium">System Prompt</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Appended to every quick task and session run for this app. Use for
              recurring instructions like{" "}
              <code>run pnpm migrate after making backend changes</code>.
            </p>
          </div>
          <textarea
            key={`system-prompt-${repoId}`}
            defaultValue={repo.systemPrompt ?? ""}
            onBlur={handleSystemPromptBlur}
            className="w-full h-32 rounded-control border border-input bg-background px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. run pnpm migrate after making backend changes"
          />
        </div>

        <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
          <div>
            <h3 className="text-sm font-medium">Dev Server</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Override the auto-detected dev server port and command for this
              app. Leave empty to auto-detect from <code>package.json</code>.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Dev Port
            </label>
            <Input
              key={`port-${repoId}`}
              type="number"
              className="h-8 text-xs"
              placeholder="Auto (5173 for vite, 3000 for next)"
              defaultValue={repo.devPort ?? ""}
              onBlur={handleDevPortBlur}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Leave empty to auto-detect.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Dev Command
            </label>
            <Input
              key={`cmd-${repoId}`}
              className="h-8 text-xs font-mono"
              placeholder="Auto (cd <rootDir> && PORT=<port> pnpm run dev)"
              defaultValue={repo.devCommand ?? ""}
              onBlur={handleDevCommandBlur}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              When set, runs verbatim. You're responsible for <code>cd</code>{" "}
              and <code>PORT=</code>. Leave empty to auto-detect.
            </p>
          </div>
        </div>

        <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
          <h3 className="text-sm font-medium">Startup Commands</h3>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Commands to run when sandbox starts
            </label>
            <textarea
              key={`startup-${repoId}`}
              defaultValue={startupCommands}
              onBlur={handleStartupCommandsBlur}
              className="w-full h-48 rounded-control border border-input bg-background px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="npx supabase start&#10;psql -h localhost -p 54322 -U postgres -d postgres < /home/eva/sandbox-config/seed.sql"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              One command per line. Runs during seeded snapshot builds{" "}
              <strong>and on every fresh sandbox boot</strong>, so commands must
              be safe to re-run (readiness gates, docker restarts). Put one-time
              data <strong>seeding</strong> in Seed Commands (Snapshots
              settings) and long-running services in Background Commands.
              Commands have a 10-minute timeout each.
            </p>
          </div>
        </div>

        <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
          <h3 className="text-sm font-medium">Background Commands</h3>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Long-running daemons to launch alongside the dev server
            </label>
            <textarea
              key={`background-${repoId}`}
              defaultValue={backgroundCommands}
              onBlur={handleBackgroundCommandsBlur}
              className="w-full h-32 rounded-control border border-input bg-background px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="npx convex dev"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              One command per line, each written as a plain foreground command.
              The platform launches every line detached for you (
              <code>nohup ... &amp;</code>), so there is no need to add your own{" "}
              <code>nohup</code>, trailing <code>&amp;</code>, or output
              redirect. Commands respawn every time the sandbox starts or
              resumes. Use for daemons like <code>npx convex dev</code>. Output
              is written to <code>/tmp/bg-&lt;index&gt;.log</code>.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
          <h3 className="text-sm font-medium">Stop Commands</h3>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Clean-shutdown commands run before snapshotting a seeded sandbox
            </label>
            <textarea
              key={`stop-${repoId}`}
              defaultValue={stopCommands}
              onBlur={handleStopCommandsBlur}
              className="w-full h-32 rounded-md bg-background px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="pkill -TERM -f 'convex dev'&#10;pnpm stop-db"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              One command per line. Run by the seeded-snapshot build before the
              filesystem snapshot is taken, so on-disk volumes (e.g. local
              Postgres) flush consistently. Not run on normal sandbox starts.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
