import { motion } from "motion/react";
import { Card, CardContent, Button } from "@conductor/ui";
import {
  IconX,
  IconSparkles,
  IconLayoutKanban,
  IconTerminal2,
  IconCode,
  IconFileText,
} from "@tabler/icons-react";

export const PLATFORM_SECTIONS = [
  {
    icon: IconLayoutKanban,
    label: "Projects",
    shortDesc: "Autonomous feature builder",
    longDesc:
      "Eva plans and executes large features end-to-end — tasks, PRs, and reviews — without interrupting your flow.",
  },
  {
    icon: IconTerminal2,
    label: "Sessions",
    shortDesc: "Interactive pair programming",
    longDesc:
      "Chat with Eva in real time to iterate on ideas, debug issues, and ship incremental changes fast.",
  },
  {
    icon: IconCode,
    label: "Quick Tasks",
    shortDesc: "Small fixes & changes",
    longDesc:
      "Ship one-off fixes and small changes without spinning up a full project or session.",
  },
  {
    icon: IconFileText,
    label: "Documents",
    shortDesc: "AI-assisted docs",
    longDesc:
      "Generate and maintain specs, PRDs, and runbooks — kept in sync with your actual codebase.",
  },
];

export function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="ui-surface-strong mb-6 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <IconSparkles size={14} className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Getting started with Eva
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onDismiss}
                className="-mr-1 h-7 w-7 text-muted-foreground hover:text-foreground relative after:absolute after:inset-[-6px]"
              >
                <IconX size={14} />
              </Button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Select a repository below to access Eva's tools for planning,
              coding, and shipping.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLATFORM_SECTIONS.map((section) => (
                <div
                  key={section.label}
                  className="flex flex-col gap-1.5 rounded-lg bg-muted/40 p-2.5"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <section.icon size={13} className="text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {section.label}
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {section.shortDesc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
