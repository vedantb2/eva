"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@eva/ui";
import { IconArrowUpRight, IconInbox } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { type Notification } from "@/lib/components/notifications/notification-config";
import { NotificationSourceAvatar } from "@/lib/components/inbox/NotificationRow";
import {
  MarkdownMentionText,
  MARKDOWN_PROSE_CLASS,
} from "@/lib/components/chat/MarkdownMentionText";
import { embedReadyMessage } from "@/lib/embed/embedded";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";
import { repoHref, toInternalRepoHref } from "@/lib/utils/repoUrl";

/**
 * The linked page itself, embedded as a same-origin iframe running the app in
 * chromeless mode (see `lib/embed/embedded.ts`). One iframe persists across
 * selections: once the embedded app announces `eva:embed-ready`, switching
 * notifications posts an `eva:embed-navigate` message and the embedded router
 * navigates in place — no SPA reboot per selection. Until that handshake (or
 * if it never arrives), switches fall back to swapping the iframe src.
 */
function NotificationPagePreview({ href }: { href: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const [booted, setBooted] = useState(false);
  // The src only seeds the first document; later hrefs arrive via postMessage.
  const [initialHref] = useState(href);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (readyRef.current && frame.contentWindow) {
      frame.contentWindow.postMessage(
        { type: "eva:embed-navigate", href },
        window.location.origin,
      );
      return;
    }
    if (frame.getAttribute("src") !== href) {
      setBooted(false);
      frame.setAttribute("src", href);
    }
  }, [href]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (embedReadyMessage.safeParse(event.data).success) {
        readyRef.current = true;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      {!booted ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : null}
      <iframe
        ref={frameRef}
        src={initialHref}
        onLoad={() => setBooted(true)}
        title="Notification page preview"
        className="absolute inset-0 size-full border-0 bg-background"
      />
    </div>
  );
}

interface NotificationDetailPaneProps {
  notification: Notification | undefined;
  repo: RepoWithLogo | undefined;
  onOpen: (notification: Notification) => void;
}

/**
 * Right column of the two-pane inbox: a slim header naming the notification's
 * source and type, above the linked page rendered live in an embedded frame.
 * "Open" leaves the inbox for the full-window page. Notifications without a
 * link fall back to showing the notification's own message in full.
 */
export function NotificationDetailPane({
  notification,
  repo,
  onOpen,
}: NotificationDetailPaneProps) {
  if (!notification) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <IconInbox className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Select a notification to preview it
        </p>
      </div>
    );
  }

  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5">
        <NotificationSourceAvatar notification={notification} repo={repo} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {notification.title}
          </span>
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            {/* No type label here — the avatar badge already carries the type. */}
            {sourceLabel ? (
              <>
                {sourceLabel}
                <span aria-hidden>·</span>
              </>
            ) : null}
            <RelativeDateTime
              at={notification.createdAt}
              className="text-xs"
            />
          </span>
        </div>
        {notification.href ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpen(notification)}
            title="Open as full page"
            className="h-7 gap-1 text-xs"
          >
            Open
            <IconArrowUpRight size={14} />
          </Button>
        ) : null}
      </div>
      {notification.href ? (
        <NotificationPagePreview href={notification.href} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar">
          <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-[-0.01em] text-balance text-foreground">
                {notification.title}
              </h2>
              {notification.contextLabel ? (
                <p className="text-sm text-muted-foreground">
                  {notification.contextLabel}
                </p>
              ) : null}
            </div>
            {notification.message ? (
              repo && notification.repoId ? (
                // Repo-scoped messages can carry `@[Label](id)` mention tokens
                // (comment/mention notifications), so they get the chip-aware
                // renderer the rest of the app uses for comment bodies.
                <MarkdownMentionText
                  text={notification.message}
                  repoBasePath={toInternalRepoHref(
                    repoHref(repo.owner, repo.name, repo.rootDirectory),
                  )}
                  repoId={notification.repoId}
                  atKind="user"
                  className={MARKDOWN_PROSE_CLASS}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {notification.message}
                </p>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
