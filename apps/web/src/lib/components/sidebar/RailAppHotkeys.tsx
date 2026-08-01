import { useNavigate } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { repoHref } from "@/lib/utils/repoUrl";
import type { RepoWithLogo } from "@/lib/utils/repoGrouping";

/** Mod+1 … Mod+9 jump straight to the 1st … 9th app tile in the rail. */
const HOTKEY_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * One `useHotkey` registration. Rendered once per slot so the hooks stay at a
 * fixed call site (no hooks inside a loop) while the repo list changes freely.
 */
function RailAppHotkey({
  slot,
  repo,
  onNavigate,
}: {
  slot: (typeof HOTKEY_SLOTS)[number];
  repo: RepoWithLogo | undefined;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();

  useHotkey(
    `Mod+${slot}`,
    (e) => {
      if (!repo) return;
      e.preventDefault();
      onNavigate();
      navigate({ to: repoHref(repo.owner, repo.name, repo.rootDirectory) });
    },
    { enabled: repo !== undefined },
  );

  return null;
}

/**
 * Keyboard shortcuts for the vertical rail's app tiles: Mod+1 selects the first
 * app, Mod+2 the second, and so on up to Mod+9. Slots beyond the app count are
 * inert, so the browser's own tab shortcuts still work there.
 */
export function RailAppHotkeys({
  repos,
  onNavigate,
}: {
  repos: RepoWithLogo[];
  onNavigate: () => void;
}) {
  return (
    <>
      {HOTKEY_SLOTS.map((slot) => (
        <RailAppHotkey
          key={slot}
          slot={slot}
          repo={repos[slot - 1]}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}
