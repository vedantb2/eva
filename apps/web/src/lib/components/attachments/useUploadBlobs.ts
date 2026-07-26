import { useMutation } from "convex/react";
import { api, type Id } from "@eva/backend";
import { parseStorageId } from "@/lib/components/artifacts/_meta";

/**
 * Uploads blobs to Convex file storage, preserving input order. Failed uploads
 * come back as `null` so callers can decide whether to drop or report them.
 * Shared by the chat composer and the quick task composer.
 */
export function useUploadBlobs() {
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  return async (
    items: Array<{ blob: Blob; contentType: string }>,
  ): Promise<Array<Id<"_storage"> | null>> =>
    Promise.all(
      items.map(async ({ blob, contentType }) => {
        try {
          const uploadUrl = await generateUploadUrl({});
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": contentType },
            body: blob,
          });
          if (!res.ok) return null;
          return parseStorageId(await res.text());
        } catch {
          return null;
        }
      }),
    );
}
