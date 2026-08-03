import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { branchParser } from "@/lib/search-params";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { parseRouteNumId } from "@/lib/numId";
import { Button, PageHeader, PageHeaderActions, Spinner } from "@eva/ui";
import { IconPlayerPlay } from "@tabler/icons-react";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
import { CodeTestingContent } from "../_components/CodeTestingContent";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/testing-arena/$numId/$arenaTab",
)({
  component: TestingArenaDetailRoute,
});

function TestingArenaDetailRoute() {
  const { numId } = Route.useParams();
  const { basePath, repo, repoId } = useRepo();
  const parsedNumId = parseRouteNumId(numId);
  const doc = useQuery(
    api.docs.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  const reports = useQuery(
    api.evaluationReports.listByDoc,
    doc ? { docId: doc._id } : "skip",
  );
  const activeReport = reports?.find(
    (r) => r.status === "running" || r.fixStatus === "fixing",
  );
  const streaming = useQuery(
    api.streaming.get,
    activeReport ? { entityId: activeReport._id } : "skip",
  );
  const startEvaluation = useMutation(api.evaluationWorkflow.startEvaluation);
  const [isRunning, setIsRunning] = useState(false);
  const [branch, setBranch] = useQueryState("branch", branchParser);

  const hasActiveRun =
    reports?.some((r) => r.status === "pending" || r.status === "running") ??
    false;
  const hasContent = (doc?.content?.trim().length ?? 0) > 0;

  const handleRunTest = async () => {
    if (!doc) return;
    setIsRunning(true);
    // Resolved before the try: React Compiler bails on the whole file when a
    // conditional expression sits inside a try/catch.
    const branchName = branch !== "main" ? branch : undefined;
    try {
      await startEvaluation({
        docId: doc._id,
        repoId: repo._id,
        branchName,
      });
    } catch (error) {
      setIsRunning(false);
      throw error;
    }
    setIsRunning(false);
  };

  if (parsedNumId === null) {
    return (
      <EntityNotFound
        entityLabel="document"
        backTo={`${basePath}/testing-arena`}
      />
    );
  }

  if (doc === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <EntityNotFound
        entityLabel="document"
        backTo={`${basePath}/testing-arena`}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader>
        <MarqueeOnHover className="min-w-0 text-2sm font-medium text-foreground">
          {doc.title}
        </MarqueeOnHover>
        <PageHeaderActions>
          <BranchSelect
            value={branch}
            onValueChange={setBranch}
            className="h-7 w-24 text-xs sm:w-36"
          />
          <Button
            size="sm"
            onClick={handleRunTest}
            disabled={isRunning || hasActiveRun || !hasContent}
            title={
              !hasContent
                ? "Add content to this document to run tests"
                : undefined
            }
          >
            <IconPlayerPlay size={16} />
            {isRunning || hasActiveRun ? "Running..." : "Run Test"}
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeTestingContent
          reports={reports}
          streamingActivity={streaming?.currentActivity}
        />
      </div>
    </div>
  );
}
