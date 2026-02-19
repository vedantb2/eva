"use client";

import { useState } from "react";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Tabs, TabsList, TabsTrigger } from "@conductor/ui";
import { EnvVariablesClient } from "./EnvVariablesClient";
import { SystemEnvVarsClient } from "./SystemEnvVarsClient";

export default function EnvVariablesPage() {
  const [tab, setTab] = useState("repo");

  return (
    <PageWrapper title="Environment Variables">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="repo">Repo</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "repo" && <EnvVariablesClient />}
      {tab === "system" && <SystemEnvVarsClient />}
    </PageWrapper>
  );
}
