"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@eva/ui";
import { IconArrowsUpDown, IconMinus, IconPlus } from "@tabler/icons-react";
import {
  APP_SORT_LABELS,
  APP_SORT_ORDERS,
  isAppSortOrder,
  isSessionSortOrder,
  MAX_SESSION_PREVIEW_COUNT,
  MIN_SESSION_PREVIEW_COUNT,
  SESSION_SORT_LABELS,
  SESSION_SORT_ORDERS,
} from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";
import { useSessionsSidebarSettings } from "@/lib/components/sidebar/useSessionsSidebarSettings";

/**
 * t3code-style sidebar options: sort apps, sort sessions, visible session count.
 * Parks beside the Sessions panel title.
 */
export function SessionsSidebarOptionsMenu() {
  const {
    settings,
    setAppSortOrder,
    setSessionSortOrder,
    setSessionPreviewCount,
  } = useSessionsSidebarSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-sidebar-primary"
          title="Sidebar options"
          aria-label="Sidebar options"
        >
          <IconArrowsUpDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Sort projects
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={settings.appSortOrder}
          onValueChange={(value) => {
            if (isAppSortOrder(value)) setAppSortOrder(value);
          }}
        >
          {APP_SORT_ORDERS.map((order) => (
            <DropdownMenuRadioItem
              key={order}
              value={order}
              className="min-h-7 py-1 text-xs"
            >
              {APP_SORT_LABELS[order]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Sort threads
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={settings.sessionSortOrder}
          onValueChange={(value) => {
            if (isSessionSortOrder(value)) setSessionSortOrder(value);
          }}
        >
          {SESSION_SORT_ORDERS.map((order) => (
            <DropdownMenuRadioItem
              key={order}
              value={order}
              className="min-h-7 py-1 text-xs"
            >
              {SESSION_SORT_LABELS[order]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Visible threads
        </DropdownMenuLabel>
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Decrease visible thread count"
            disabled={settings.sessionPreviewCount <= MIN_SESSION_PREVIEW_COUNT}
            onPointerDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              setSessionPreviewCount(settings.sessionPreviewCount - 1);
            }}
          >
            <IconMinus size={14} />
          </Button>
          <span className="w-8 text-center text-xs tabular-nums text-foreground">
            {settings.sessionPreviewCount}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Increase visible thread count"
            disabled={settings.sessionPreviewCount >= MAX_SESSION_PREVIEW_COUNT}
            onPointerDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              setSessionPreviewCount(settings.sessionPreviewCount + 1);
            }}
          >
            <IconPlus size={14} />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
