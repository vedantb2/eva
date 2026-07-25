import type { ActivityStep } from "@eva/ui";
import {
  IconCode,
  IconFileText,
  IconLayoutKanban,
  IconTerminal2,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

export const LANDING_MOCK_REPO = "acme/web";
export const LANDING_MOCK_TASK_NUMBER = 142;
export const LANDING_MOCK_TASK_TITLE = "Fix checkout postcode validation";

export const LANDING_PLATFORM_SECTIONS: {
  icon: TablerIcon;
  label: string;
  shortDesc: string;
}[] = [
  {
    icon: IconLayoutKanban,
    label: "Projects",
    shortDesc: "Autonomous feature builder",
  },
  {
    icon: IconTerminal2,
    label: "Sessions",
    shortDesc: "Interactive pair programming",
  },
  {
    icon: IconCode,
    label: "Quick Tasks",
    shortDesc: "Small fixes & changes",
  },
  {
    icon: IconFileText,
    label: "Documents",
    shortDesc: "AI-assisted docs",
  },
];

export const LANDING_MOCK_RUN_STEPS: ActivityStep[] = [
  {
    type: "read",
    label: "Read",
    detail: "src/checkout/validate.ts",
    status: "complete",
  },
  {
    type: "edit",
    label: "Edited",
    detail: "src/checkout/validate.ts",
    status: "complete",
  },
  {
    type: "bash",
    label: "Ran command",
    detail: "pnpm test checkout",
    status: "complete",
  },
];
