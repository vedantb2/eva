"use client";

import { Tabs, TabsList, TabsTrigger } from "@eva/ui";
import type { EnvVarScope } from "@/lib/search-params";
import { useNavigate } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SettingsPage } from "@/lib/components/settings/SettingsPage";
import { EnvVariablesClient } from "./EnvVariablesClient";
import { TeamEnvVarsClient } from "./TeamEnvVarsClient";

export function EnvVariablesPageClient({ scope }: { scope: EnvVarScope }) {
  const navigate = useNavigate();
  const { basePath } = useRepo();

  return (
    <SettingsPage
      title="Environment Variables"
      stack={false}
      tabs={
        <Tabs
          value={scope}
          onValueChange={(value) => {
            if (value === "repo" || value === "team") {
              navigate({
                to: `${basePath}/settings/env-variables/${value}`,
              });
            }
          }}
        >
          <TabsList className="tabs-segmented">
            <TabsTrigger value="repo">Repo</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {scope === "repo" ? <EnvVariablesClient /> : null}
      {scope === "team" ? <TeamEnvVarsClient /> : null}
    </SettingsPage>
  );
}
