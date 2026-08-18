"use client";

import { useQueryState } from "nuqs";
import { docModeParser, type DocMode } from "@/lib/search-params";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from "@eva/ui";
import { IconPencil, IconMessageDots, IconEye } from "@tabler/icons-react";

const MODE_CONFIG: Record<DocMode, { label: string; icon: typeof IconPencil }> =
  {
    editing: { label: "Editing", icon: IconPencil },
    suggesting: { label: "Suggesting", icon: IconMessageDots },
    viewing: { label: "Viewing", icon: IconEye },
  };

const DOC_MODES: readonly DocMode[] = ["editing", "suggesting", "viewing"];

export function DocModeSwitcher() {
  const [mode, setMode] = useQueryState("mode", docModeParser);

  const current = MODE_CONFIG[mode];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          aria-label={`Mode: ${current.label}`}
        >
          <Icon size={14} aria-hidden />
          <span className="hidden sm:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {DOC_MODES.map((m) => {
          const config = MODE_CONFIG[m];
          const ModeIcon = config.icon;
          return (
            <DropdownMenuItem
              key={m}
              onClick={() => setMode(m)}
              className={m === mode ? "bg-accent" : undefined}
            >
              <ModeIcon size={16} />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
