import {
  IconLayoutKanban,
  IconTerminal2,
  IconCode,
  IconFileText,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";

export interface PlatformSection {
  icon: Icon;
  label: string;
  shortDesc: string;
  longDesc: string;
}

export const PLATFORM_SECTIONS: PlatformSection[] = [
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
