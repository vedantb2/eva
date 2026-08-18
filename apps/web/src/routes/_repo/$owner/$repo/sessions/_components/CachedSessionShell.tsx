"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RepoProvider, RepoGate, useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import { SessionDetailClient } from "../SessionDetailClient";
import { useSessionRouteSandboxTab } from "../_utils/useSessionRouteSandboxTab";
import { SimpleViewSandboxRedirect } from "@/lib/components/sandbox/SimpleViewSandboxRedirect";
import { useSimpleView } from "@/lib/hooks/useSimpleView";

interface CachedSessionShellProps {
  numId: string;
  /**
   * Repo identity captured when the shell was cached — NOT the live URL.
   * The sessions layout survives `$owner/$repo` changes, so a hidden shell
   * must keep resolving against its own repo, not the one now in the URL.
   */
  owner: string;
  repoParam: string;
  /** True when this shell matches the URL `$numId` (visible). */
  isActiveRoute: boolean;
}

/**
 * One kept-alive session detail tree. While `isActiveRoute` is false the shell
 * stays mounted (parent uses `hidden`) and freezes its sandbox tab so the
 * active session's URL does not rewrite sibling caches. Each shell carries its
 * own passive RepoProvider so shells from other apps stay resolvable.
 */
export function CachedSessionShell({
  numId,
  owner,
  repoParam,
  isActiveRoute,
}: CachedSessionShellProps) {
  return (
    <RepoProvider owner={owner} repoParam={repoParam} passive>
      <RepoGate>
        <CachedSessionShellInner
          numId={numId}
          owner={owner}
          repoParam={repoParam}
          isActiveRoute={isActiveRoute}
        />
      </RepoGate>
    </RepoProvider>
  );
}

function CachedSessionShellInner({
  numId,
  owner,
  repoParam,
  isActiveRoute,
}: CachedSessionShellProps) {
  const navigate = useNavigate();
  const { basePath, repoId } = useRepo();
  const simpleView = useSimpleView();
  const { status, convexId } = useSessionByNumId(numId, repoId);
  const urlSandboxTab = useSessionRouteSandboxTab();
  const [sandboxTab, setSandboxTab] = useState(urlSandboxTab);

  useEffect(() => {
    if (!isActiveRoute) return;
    setSandboxTab(urlSandboxTab);
  }, [isActiveRoute, urlSandboxTab]);

  const openFile = (path: string) => {
    if (simpleView) return;
    void navigate({
      to: `${basePath}/sessions/${numId}/files`,
      search: (prev) => ({ ...prev, file: path }),
    });
  };

  const openDiffs = (repoRelativePath?: string) => {
    if (simpleView) return;
    void navigate({
      to: `${basePath}/sessions/${numId}/review/diffs/unified`,
      search: (prev) => ({
        ...prev,
        ...(repoRelativePath ? { diffFile: repoRelativePath } : {}),
      }),
    });
  };

  const onSandboxTabChange = (next: string) => {
    if (next === "review") {
      void navigate({
        to: `${basePath}/sessions/${numId}/review/diffs/unified`,
        search: true,
      });
      return;
    }
    void navigate({
      to: `${basePath}/sessions/${numId}/${next}`,
      search: true,
    });
  };

  return (
    <>
      {/* Only the visible shell may redirect — a hidden shell firing Navigate
          would hijack the active session's URL. */}
      {isActiveRoute ? (
        <SimpleViewSandboxRedirect
          activeTab={sandboxTab}
          to="/$owner/$repo/sessions/$numId/$sandboxTab"
          params={{ owner, repo: repoParam, numId }}
        />
      ) : null}
    <EntityNumIdGate
      status={status}
      convexId={convexId}
      entityLabel="session"
      backTo={`${basePath}/sessions`}
    >
      {(sessionId) => (
        <SessionDetailClient
          sessionId={sessionId}
          activeSandboxTab={sandboxTab}
          onSandboxTabChange={onSandboxTabChange}
          onOpenFile={openFile}
          onViewDiff={simpleView ? undefined : openDiffs}
          isRouteActive={isActiveRoute}
        />
      )}
    </EntityNumIdGate>
    </>
  );
}
