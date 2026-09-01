import { IconPictureInPicture } from "@tabler/icons-react";
import { Button } from "@eva/ui";
import { closePreviewMiniPlayer } from "@/lib/components/sandbox/previewMiniPlayerStore";

/**
 * Stands in for the preview body while the user has popped it out. Only one
 * anchor may claim a hosted iframe, so the pane must not render its own until
 * the mini-player gives the preview back.
 */
export function PreviewFloatingPlaceholder() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
      <IconPictureInPicture className="size-12 opacity-50" />
      <p className="text-sm">Preview is floating</p>
      <Button size="sm" variant="secondary" onClick={closePreviewMiniPlayer}>
        Bring back
      </Button>
    </div>
  );
}
