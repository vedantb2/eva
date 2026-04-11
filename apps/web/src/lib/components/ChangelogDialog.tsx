"use client";

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

const changelogPlugins = { cjk, math, mermaid };

export function ChangelogDialog() {
  const changelog = useQuery(api.changelog.getLatestChangelog);
  const dismiss = useMutation(api.changelog.dismissChangelog);

  if (!changelog || !changelog.show) return null;

  const weekLabel = dayjs(changelog.publishedAt).format("MMM D, YYYY");

  function handleDismiss() {
    void dismiss();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-2xl">
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
            <div className="rounded-lg bg-muted/40 p-4">
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
          <Button onClick={handleDismiss}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
