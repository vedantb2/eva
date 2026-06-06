"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Button,
} from "@conductor/ui";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { IconSparkles } from "@tabler/icons-react";
import dayjs from "dayjs";
import {
  useDevChangelogPreview,
  useDevPreviewSearchKey,
} from "@/lib/dev/preview";

const changelogPlugins = { cjk, math, mermaid };

export function ChangelogDialog() {
  const [forcedDismissed, setForcedDismissed] = useState(false);
  const previewSearchKey = useDevPreviewSearchKey();
  const isPreview = useDevChangelogPreview();
  const forceShow = isPreview && !forcedDismissed;
  const changelog = useQuery(api.changelog.getLatestChangelog);

  useEffect(() => {
    if (isPreview) {
      setForcedDismissed(false);
    }
  }, [isPreview, previewSearchKey]);
  const dismiss = useMutation(
    api.changelog.dismissChangelog,
  ).withOptimisticUpdate((localStore) => {
    const current = localStore.getQuery(api.changelog.getLatestChangelog, {});
    if (current) {
      localStore.setQuery(
        api.changelog.getLatestChangelog,
        {},
        {
          ...current,
          show: false,
        },
      );
    }
  });

  if (!changelog) return null;
  if (!changelog.show && !forceShow) return null;

  const weekLabel = dayjs(changelog.publishedAt).format("MMM D, YYYY");

  function handleDismiss() {
    if (isPreview) {
      setForcedDismissed(true);
      return;
    }
    void dismiss();
  }

  return (
    <Dialog open>
      <DialogContent
        hideCloseButton
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="max-w-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <IconSparkles className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle>What&apos;s New</DialogTitle>
              <DialogDescription>Week of {weekLabel}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="rounded-surface border border-border bg-card p-4">
              <Streamdown
                className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                plugins={changelogPlugins}
              >
                {changelog.content}
              </Streamdown>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button onClick={handleDismiss}>Yes, I&apos;ve read this</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
