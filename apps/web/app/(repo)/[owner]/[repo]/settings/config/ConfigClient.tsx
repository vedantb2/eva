"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api, CLAUDE_MODELS } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Input,
  Button,
} from "@conductor/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { IconPlus, IconX } from "@tabler/icons-react";

export function ConfigClient() {
  const { repo, repoId } = useRepo();
  const updateConfig = useMutation(api.githubRepos.updateConfig);

  return (
    <PageWrapper title="Config">
      <div className="space-y-4">
        <div className="rounded-lg border border-border/70 p-3 space-y-4 sm:p-4">
          <h3 className="text-sm font-medium">Repository Configuration</h3>

          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Default Base Branch
              </label>
              <BranchSelect
                value={repo.defaultBaseBranch ?? "main"}
                onValueChange={(val) =>
                  updateConfig({ repoId, defaultBaseBranch: val || undefined })
                }
                className="h-8 text-xs"
                placeholder="Select a branch"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                The default branch used when creating quick tasks. Defaults to{" "}
                <code>main</code> if not set.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Default Model
              </label>
              <Select
                value={repo.defaultModel ?? "sonnet"}
                onValueChange={(val) => {
                  const model = CLAUDE_MODELS.find((m) => m === val);
                  if (model) updateConfig({ repoId, defaultModel: model });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAUDE_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                The default model used when creating new tasks. Defaults to{" "}
                <code>Sonnet</code> if not set.
              </p>
            </div>

            {repo.parentRepoId && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Deployment Project Name
                </label>
                <Input
                  className="h-8 text-xs"
                  placeholder="e.g. my-vercel-project"
                  defaultValue={repo.deploymentProjectName ?? ""}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (repo.deploymentProjectName ?? "")) {
                      updateConfig({
                        repoId,
                        deploymentProjectName: val || undefined,
                      });
                    }
                  }}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Vercel or Netlify project name for this app. Used to match the
                  correct preview deployment in monorepos.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 p-3 space-y-4 sm:p-4">
          <h3 className="text-sm font-medium">Feature Toggles</h3>
          <div className="grid gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={repo.sessionsVncEnabled !== false}
                onCheckedChange={(checked) =>
                  updateConfig({ repoId, sessionsVncEnabled: checked === true })
                }
              />
              <div>
                <p className="text-xs font-medium">Sessions Desktop (VNC)</p>
                <p className="text-[11px] text-muted-foreground">
                  Enable the desktop tab in sessions for VNC access.
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={repo.sessionsVscodeEnabled !== false}
                onCheckedChange={(checked) =>
                  updateConfig({
                    repoId,
                    sessionsVscodeEnabled: checked === true,
                  })
                }
              />
              <div>
                <p className="text-xs font-medium">Sessions Editor (VSCode)</p>
                <p className="text-[11px] text-muted-foreground">
                  Enable the code editor tab in sessions.
                </p>
              </div>
            </label>
          </div>
        </div>

        <DomainsSection />
      </div>
    </PageWrapper>
  );
}

function extractHostname(raw: string): string {
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.hostname;
  } catch {
    return raw;
  }
}

function DomainsSection() {
  const { repo, repoId } = useRepo();
  const updateConfig = useMutation(api.githubRepos.updateConfig);
  const [newDomain, setNewDomain] = useState("");

  const domains = repo.domains ?? [];

  const addDomain = () => {
    const raw = newDomain.trim().toLowerCase();
    if (!raw) return;
    const hostname = extractHostname(raw);
    if (domains.includes(hostname)) return;
    updateConfig({ repoId, domains: [...domains, hostname] });
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    updateConfig({ repoId, domains: domains.filter((d) => d !== domain) });
  };

  return (
    <div className="rounded-lg border border-border/70 p-3 space-y-4 sm:p-4">
      <div>
        <h3 className="text-sm font-medium">Domains</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Hostnames where this app is deployed. The Chrome extension will
          auto-select this repo when browsing these domains.
        </p>
      </div>

      {domains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs"
            >
              {domain}
              <button
                type="button"
                onClick={() => removeDomain(domain)}
                className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          className="h-8 text-xs flex-1"
          placeholder="e.g. myapp.com or localhost:3000"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addDomain();
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={addDomain}
          disabled={!newDomain.trim()}
        >
          <IconPlus size={14} />
          Add
        </Button>
      </div>
    </div>
  );
}
