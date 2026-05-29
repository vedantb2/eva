import { useParams } from "@tanstack/react-router";
import {
  isTaskDetailTab,
  type TaskDetailTab,
} from "@/lib/components/tasks/_components/task-detail-constants";
import {
  isTaskRouteSandboxTab,
  type TaskRouteSandboxTab,
} from "@/lib/search-params";

export type QuickTaskRouteState =
  | { surface: "detail"; detailTab: TaskDetailTab; sandboxTab?: undefined }
  | {
      surface: "sandbox";
      sandboxTab: TaskRouteSandboxTab;
      detailTab: TaskDetailTab;
    };

/**
 * Reads the active quick-task child segment (detail tab or sandbox tab) from the
 * matched route params without remounting the parent layout.
 */
export function useQuickTaskRouteState(): QuickTaskRouteState | null {
  const params = useParams({ strict: false });

  const sandboxTab = params.sandboxTab;
  if (typeof sandboxTab === "string" && isTaskRouteSandboxTab(sandboxTab)) {
    return {
      surface: "sandbox",
      sandboxTab,
      detailTab: "activity",
    };
  }

  const detailTab = params.detailTab;
  if (typeof detailTab === "string" && isTaskDetailTab(detailTab)) {
    return { surface: "detail", detailTab };
  }

  return null;
}
