"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArtifactFrame } from "./ArtifactFrame";

/** Loads an artifact's stored HTML and renders it in the bridged sandbox iframe. */
export function ArtifactViewer({ artifactId }: { artifactId: string }) {
  const artifact = useQuery(api.artifacts.get, { id: artifactId });
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const url = artifact?.url ?? null;
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setHtml(null);
    setError(null);
    fetch(url)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Failed to load artifact (status ${r.status})`);
        }
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setHtml(text);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (artifact === undefined) {
    return <Centered>{<Spinner />}</Centered>;
  }
  if (artifact === null) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">
          Artifact not found, or you do not have access.
        </p>
      </Centered>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/artifacts"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft size={16} />
          Artifacts
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="truncate font-medium text-foreground">
          {artifact.name}
        </h1>
      </div>
      <div className="h-[80vh] w-full overflow-hidden rounded-surface border border-border bg-white shadow-sm">
        {error ? (
          <Centered>
            <p className="text-sm text-destructive">{error}</p>
          </Centered>
        ) : html === null ? (
          <Centered>{<Spinner />}</Centered>
        ) : (
          <ArtifactFrame html={html} title={artifact.name} />
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
