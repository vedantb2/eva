"use client";

import { useQueryState } from "nuqs";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Tabs, TabsList, TabsTrigger } from "@conductor/ui";
import { envVarTabParser } from "@/lib/search-params";
import { EnvVariablesClient } from "./EnvVariablesClient";
import { TeamEnvVarsClient } from "./TeamEnvVarsClient";

export function EnvVariablesPageClient() {
  const [tab, setTab] = useQueryState("tab", envVarTabParser);

  return (
    <PageWrapper title="Environment Variables" comfortable>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === "repo" || value === "team") {
            setTab(value);
          }
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="repo">Repo</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "repo" && <EnvVariablesClient />}
      {tab === "team" && <TeamEnvVarsClient />}
    </PageWrapper>
  );
}
