"use client";

import { useState } from "react";
import { Input, Button } from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { IconPlus, IconX } from "@tabler/icons-react";
import { extractHostname } from "../_utils";

type UpdateRepoConfig = (args: {
  repoId: Id<"githubRepos">;
  domains?: string[];
}) => void;

export function DomainsSection({
  repoId,
  domains,
  updateConfig,
}: {
  repoId: Id<"githubRepos">;
  domains: string[];
  updateConfig: UpdateRepoConfig;
}) {
  const [newDomain, setNewDomain] = useState("");

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
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Domains
        </label>
        <p className="text-[11px] text-muted-foreground">
          Hostnames where this app is deployed. The Chrome extension will
          auto-select this repo when browsing these domains.
        </p>
      </div>

      {domains.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1 text-xs"
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
      ) : null}

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
