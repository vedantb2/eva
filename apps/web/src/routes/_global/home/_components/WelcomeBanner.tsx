import { m } from "motion/react";
import { Button } from "@eva/ui";
import { IconX } from "@tabler/icons-react";
import { PLATFORM_SECTIONS } from "@/lib/content/platformSections";

export function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-6 overflow-hidden rounded-surface border border-border bg-card"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Getting started</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick a codebase below to open Projects, Sessions, and Quick Tasks.
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDismiss}
          className="-mr-1 h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <IconX size={14} />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {PLATFORM_SECTIONS.map((section) => (
          <div key={section.label} className="bg-card px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <section.icon size={13} className="text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">
                {section.label}
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {section.shortDesc}
            </p>
          </div>
        ))}
      </div>
    </m.div>
  );
}
