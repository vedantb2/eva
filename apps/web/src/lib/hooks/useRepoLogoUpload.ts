import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { parseStorageId } from "@/lib/components/artifacts/_meta";

/**
 * Shared logo upload/remove logic for repo cards and the settings page. Owns the
 * single-request Convex storage upload (logos are small, so no chunking) and the
 * `uploading` flag; the current logo itself is read reactively from queries, so
 * this hook keeps no image state of its own.
 */
export function useRepoLogoUpload() {
  const generateUploadUrl = useMutation(api.githubRepos.generateLogoUploadUrl);
  const setLogo = useMutation(api.githubRepos.setLogo);
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (repoId: Id<"githubRepos">, file: File) => {
    setUploading(true);
    let uploadError: Error | undefined;
    // Built outside the try: React Compiler bails on the whole file when a
    // logical expression sits inside a try/catch.
    const contentType = file.type || "application/octet-stream";
    try {
      const uploadUrl = await generateUploadUrl({ repoId });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: file,
      });
      const responseText = await result.text();
      if (!result.ok) {
        uploadError = new Error(
          `Logo upload failed (status ${result.status}): ${responseText}`,
        );
      } else {
        const storageId = parseStorageId(responseText);
        if (!storageId) {
          uploadError = new Error("Invalid response from storage");
        } else {
          await setLogo({ repoId, storageId });
        }
      }
    } catch (error) {
      setUploading(false);
      throw error;
    }
    setUploading(false);
    if (uploadError) {
      throw uploadError;
    }
  };

  const removeLogo = async (repoId: Id<"githubRepos">) => {
    await setLogo({ repoId, storageId: null });
  };

  return { uploadLogo, removeLogo, uploading };
}
