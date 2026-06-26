"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useCallback } from "react";

export function useImageUpload(docId: Id<"docs">) {
  const generateUploadUrl = useMutation(api.docs.generateUploadUrl);

  const uploadImage = useCallback(
    async (file: File): Promise<Id<"_storage">> => {
      const uploadUrl = await generateUploadUrl({ docId });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!response.ok) {
        throw new Error("Image upload failed");
      }
      const json: { storageId?: Id<"_storage"> } = await response.json();
      if (!json.storageId) {
        throw new Error("Upload response missing storageId");
      }
      return json.storageId;
    },
    [docId, generateUploadUrl],
  );

  return { uploadImage };
}

export function useDocImageUrl(
  docId: Id<"docs">,
  storageId: string | undefined,
) {
  return useQuery(
    api.docs.getImageUrl,
    storageId ? { docId, storageId } : "skip",
  );
}
