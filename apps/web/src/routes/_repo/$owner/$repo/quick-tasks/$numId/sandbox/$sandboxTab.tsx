import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  isLegacyDesktopSandboxTab,
  isTaskRouteSandboxTab,
  splitCorruptedSandboxTabParam,
} from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
)({
  beforeLoad: ({ params }) => {
    const corrupted = splitCorruptedSandboxTabParam(params.sandboxTab);
    if (corrupted) {
      const sandboxTab = isLegacyDesktopSandboxTab(corrupted.tab)
        ? "computer"
        : isTaskRouteSandboxTab(corrupted.tab)
          ? corrupted.tab
          : "preview";
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab,
        },
        search: {
          draft: undefined,
          diffFile: corrupted.diffFile,
          diffView: corrupted.diffView,
        },
        replace: true,
      });
    }
    if (isLegacyDesktopSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab: "computer",
        },
        search: { draft: undefined },
        replace: true,
      });
    }
    if (!isTaskRouteSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab: "preview",
        },
        search: { draft: undefined },
      });
    }
  },
  component: () => null,
});
