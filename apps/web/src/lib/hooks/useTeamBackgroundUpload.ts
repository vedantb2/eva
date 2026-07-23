import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { parseStorageId } from "@/lib/components/artifacts/_meta";

/**
 * Team sidebar-background upload/remove. Same Convex storage flow as
 * useTeamLogoUpload, scoped to backgroundStorageId.
 */
export function useTeamBackgroundUpload() {
  const generateUploadUrl = useMutation(api.teams.generateBackgroundUploadUrl);
  const setBackground = useMutation(api.teams.setBackground);
  const [uploading, setUploading] = useState(false);

  const uploadBackground = async (teamId: Id<"teams">, file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ teamId });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const responseText = await result.text();
      if (!result.ok) {
        throw new Error(
          `Background upload failed (status ${result.status}): ${responseText}`,
        );
      }
      const storageId = parseStorageId(responseText);
      if (!storageId) {
        throw new Error("Invalid response from storage");
      }
      await setBackground({ teamId, storageId });
    } catch (error) {
      setUploading(false);
      throw error;
    }
    setUploading(false);
  };

  const removeBackground = async (teamId: Id<"teams">) => {
    await setBackground({ teamId, storageId: null });
  };

  return { uploadBackground, removeBackground, uploading };
}
