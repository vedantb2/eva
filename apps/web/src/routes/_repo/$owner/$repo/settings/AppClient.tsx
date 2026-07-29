"use client";

import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Input, Textarea } from "@eva/ui";
import { parseCommandLines } from "./_utils";
import { LogoSettingsSection } from "./_components/LogoSettingsSection";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsField } from "@/lib/components/settings/SettingsField";

/** Every command box on this page is a monospace, resizable textarea. */
const COMMAND_TEXTAREA_CLASS = "resize-y bg-background font-mono text-xs";

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

        <SettingsSection
          title="System Prompt"
          description={
            <>
              Appended to every quick task and session run for this app. Use for
              recurring instructions like{" "}
              <code>run pnpm migrate after making backend changes</code>.
            </>
          }
        >
          <Textarea
            key={`system-prompt-${repoId}`}
            defaultValue={repo.systemPrompt ?? ""}
            onBlur={handleSystemPromptBlur}
            className={`h-32 ${COMMAND_TEXTAREA_CLASS}`}
            placeholder="e.g. run pnpm migrate after making backend changes"
          />
        </SettingsSection>

        <SettingsSection
          title="Dev Server"
          description={
            <>
              Override the auto-detected dev server port and command for this
              app. Leave empty to auto-detect from <code>package.json</code>.
            </>
          }
        >
          <div className="grid gap-4">
            <SettingsField
              label="Dev Port"
              description="Leave empty to auto-detect."
            >
              <Input
                key={`port-${repoId}`}
                type="number"
                className="h-8 text-xs"
                placeholder="Auto (5173 for vite, 3000 for next)"
                defaultValue={repo.devPort ?? ""}
                onBlur={handleDevPortBlur}
              />
            </SettingsField>

            <SettingsField
              label="Dev Command"
              description={
                <>
                  When set, runs verbatim. You are responsible for{" "}
                  <code>cd</code> and <code>PORT=</code>. Leave empty to
                  auto-detect.
                </>
              }
            >
              <Input
                key={`cmd-${repoId}`}
                className="h-8 font-mono text-xs"
                placeholder="Auto (cd <rootDir> && PORT=<port> pnpm run dev)"
                defaultValue={repo.devCommand ?? ""}
                onBlur={handleDevCommandBlur}
              />
            </SettingsField>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Startup Commands"
          description="Commands to run when the sandbox starts, one per line."
        >
          <SettingsField
            label="Commands"
            description={
              <>
                Runs during seeded snapshot builds{" "}
                <strong>and on every fresh sandbox boot</strong>, so commands
                must be safe to re-run (readiness gates, docker restarts). Put
                one-time data <strong>seeding</strong> in Seed Commands
                (Snapshots settings) and long-running services in Background
                Commands. Commands have a 10-minute timeout each.
              </>
            }
          >
            <Textarea
              key={`startup-${repoId}`}
              defaultValue={startupCommands}
              onBlur={handleStartupCommandsBlur}
              className={`h-48 ${COMMAND_TEXTAREA_CLASS}`}
              placeholder="npx supabase start&#10;psql -h localhost -p 54322 -U postgres -d postgres < /home/eva/sandbox-config/seed.sql"
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="Background Commands"
          description="Long-running daemons to launch alongside the dev server, one per line."
        >
          <SettingsField
            label="Commands"
            description={
              <>
                Write each line as a plain foreground command. The platform
                launches every line detached for you (
                <code>nohup ... &amp;</code>), so there is no need to add your
                own <code>nohup</code>, trailing <code>&amp;</code>, or output
                redirect. Commands respawn every time the sandbox starts or
                resumes. Use for daemons like <code>npx convex dev</code>.
                Output is written to <code>/tmp/bg-&lt;index&gt;.log</code>.
              </>
            }
          >
            <Textarea
              key={`background-${repoId}`}
              defaultValue={backgroundCommands}
              onBlur={handleBackgroundCommandsBlur}
              className={`h-32 ${COMMAND_TEXTAREA_CLASS}`}
              placeholder="npx convex dev"
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="Stop Commands"
          description="Clean-shutdown commands run before snapshotting a seeded sandbox."
        >
          <SettingsField
            label="Commands"
            description="One command per line. Run by the seeded-snapshot build before the filesystem snapshot is taken, so on-disk volumes (e.g. local Postgres) flush consistently. Not run on normal sandbox starts."
          >
            <Textarea
              key={`stop-${repoId}`}
              defaultValue={stopCommands}
              onBlur={handleStopCommandsBlur}
              className={`h-32 ${COMMAND_TEXTAREA_CLASS}`}
              placeholder="pkill -TERM -f 'convex dev'&#10;pnpm stop-db"
            />
          </SettingsField>
        </SettingsSection>
      </div>
    </PageWrapper>
  );
}
