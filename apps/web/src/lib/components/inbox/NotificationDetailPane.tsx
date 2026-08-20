"use client";

import { Button } from "@eva/ui";
import { IconArrowUpRight, IconInbox } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import {
  getNotificationAppearance,
  type Notification,
} from "@/lib/components/notifications/notification-config";
import { NotificationSourceAvatar } from "@/lib/components/inbox/NotificationRow";
import {
  MarkdownMentionText,
  MARKDOWN_PROSE_CLASS,
} from "@/lib/components/chat/MarkdownMentionText";
import { repoDisplayLabel, type RepoWithLogo } from "@/lib/utils/repoGrouping";
import { repoHref, toInternalRepoHref } from "@/lib/utils/repoUrl";

/**
 * Human label for where a notification's href leads, parsed from the path the
 * backend builds in `createNotification` (task/project/session/doc detail
 * routes keyed by numId). Unrecognised paths fall back to a generic label.
 */
function describeNotificationHref(href: string): string {
  const pathname = href.split("?")[0]?.split("#")[0] ?? href;
  const segments = pathname.split("/").filter(Boolean);
  const after = (section: string): string[] => {
    const i = segments.indexOf(section);
    return i >= 0 ? segments.slice(i + 1) : [];
  };
  const isNumId = (s: string | undefined): s is string =>
    s !== undefined && /^\d+$/.test(s);

  const projects = after("projects");
  if (isNumId(projects[0]) && isNumId(projects[1]))
    return `Task #${projects[1]}`;
  if (isNumId(projects[0])) return `Project #${projects[0]}`;
  const quickTasks = after("quick-tasks");
  if (isNumId(quickTasks[0])) return `Quick task #${quickTasks[0]}`;
  const sessions = after("sessions");
  if (isNumId(sessions[0])) return `Session #${sessions[0]}`;
  const docs = after("docs");
  if (isNumId(docs[0])) return `Doc #${docs[0]}`;
  return "Linked page";
}

interface NotificationDetailPaneProps {
  notification: Notification | undefined;
  repo: RepoWithLogo | undefined;
  onOpen: (notification: Notification) => void;
}

/**
 * Right column of the two-pane inbox: the selected notification in full —
 * source, type, complete (unclipped) message, and a card linking to the
 * entity the notification is about. The list rows truncate all of this.
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

  const appearance = getNotificationAppearance(notification);
  const sourceLabel = repo ? repoDisplayLabel(repo) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5">
        <NotificationSourceAvatar notification={notification} repo={repo} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {sourceLabel ?? appearance.label}
          </span>
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            {/* Without a repo the top line already shows the type label. */}
            {sourceLabel ? (
              <>
                {appearance.label}
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
            onClick={() => onOpen(notification)}
            className="h-7 gap-1 text-xs"
          >
            Open
            <IconArrowUpRight size={14} />
          </Button>
        ) : null}
      </div>
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
          {notification.href ? (
            <button
              onClick={() => onOpen(notification)}
              className="motion-press group flex w-full items-center gap-3 rounded-surface bg-muted px-4 py-3 text-left transition-colors hover:bg-muted/70 active:scale-[0.99]"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">
                  {describeNotificationHref(notification.href)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {notification.href}
                </span>
              </div>
              <IconArrowUpRight
                size={16}
                className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
