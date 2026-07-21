import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  isLegacyDesktopSandboxTab,
  isLegacyDiffsSandboxTab,
  isTaskRouteSandboxTab,
  splitCorruptedSandboxTabParam,
} from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
)({
  beforeLoad: ({ params, search }) => {
    const corrupted = splitCorruptedSandboxTabParam(params.sandboxTab);
    if (corrupted) {
      const sandboxTab = isLegacyDesktopSandboxTab(corrupted.tab)
        ? "computer"
        : isLegacyDiffsSandboxTab(corrupted.tab)
          ? "pr"
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
          prTab: isLegacyDiffsSandboxTab(corrupted.tab) ? "diffs" : undefined,
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
        search: {
          draft: undefined,
          diffFile: undefined,
          diffView: undefined,
          prTab: undefined,
        },
        replace: true,
      });
    }
    if (isLegacyDiffsSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab: "pr",
        },
        search: {
          ...search,
          draft: undefined,
          prTab: "diffs",
        },
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
        search: {
          draft: undefined,
          diffFile: undefined,
          diffView: undefined,
          prTab: undefined,
        },
      });
    }
  },
  component: () => null,
});
