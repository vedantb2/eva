"use client";

import { Suspense, use, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { Spinner } from "@eva/ui";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";
import { ArtifactFrame } from "./ArtifactFrame";
import { EntityNotFound } from "@/lib/components/EntityNotFound";

type ArtifactHtmlResult =
  | { ok: true; html: string }
  | { ok: false; error: string };

const artifactHtmlCache = new Map<string, Promise<ArtifactHtmlResult>>();

function loadArtifactHtml(url: string): Promise<ArtifactHtmlResult> {
  const cached = artifactHtmlCache.get(url);
  if (cached) return cached;
  const promise = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        return {
          ok: false as const,
          error: `Failed to load artifact (status ${response.status})`,
        };
      }
      return { ok: true as const, html: await response.text() };
    })
    .catch((error: Error) => ({
      ok: false as const,
      error: error.message || String(error),
    }));
  artifactHtmlCache.set(url, promise);
  return promise;
}

function ArtifactHtmlBody({ url, title }: { url: string; title: string }) {
  const result = use(loadArtifactHtml(url));
  if (!result.ok) {
    return (
      <Centered>
        <p className="text-sm text-destructive">{result.error}</p>
      </Centered>
    );
  }
  return <ArtifactFrame html={result.html} title={title} />;
}

/** Loads an artifact's stored HTML and renders it in the bridged sandbox iframe. */
export function ArtifactViewer({ artifactId }: { artifactId: string }) {
  const artifact = useQuery(api.artifacts.get, { id: artifactId });

  if (artifact === undefined) {
    return <Centered>{<Spinner />}</Centered>;
  }
  if (artifact === null) {
    return (
      <EntityNotFound
        entityLabel="artifact"
        description="It may have been deleted, the link could be wrong, or you may not have access."
        backTo="/artifacts"
      />
    );
  }

  const url = artifact.url;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to="/artifacts"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft size={16} />
          Artifacts
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="min-w-0 truncate text-balance font-medium text-foreground">
          {artifact.name}
        </h1>
        <button
          type="button"
          onClick={() =>
            window.open(`/artifacts/${artifact._id}`, "_blank", "noopener")
          }
          className="ml-auto flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconExternalLink size={16} />
          Open in new tab
        </button>
      </div>
      <div className="min-h-0 w-full flex-1 overflow-hidden rounded-surface border border-border bg-white">
        {url ? (
          <Suspense
            fallback={
              <Centered>
                <div className="flex flex-col items-center gap-2">
                  <Spinner />
                  <span className="text-sm text-muted-foreground">
                    Loading dashboard…
                  </span>
                </div>
              </Centered>
            }
          >
            <ArtifactHtmlBody key={url} url={url} title={artifact.name} />
          </Suspense>
        ) : (
          <Centered>
            <p className="text-sm text-muted-foreground">
              Artifact has no content URL.
            </p>
          </Centered>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center">
      {children}
    </div>
  );
}
