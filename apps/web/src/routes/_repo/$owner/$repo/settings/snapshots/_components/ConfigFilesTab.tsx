"use client";

import { useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, Spinner } from "@eva/ui";
import { IconFile, IconPlayerPlay, IconTrash, IconUpload } from "@tabler/icons-react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import { formatFileSize } from "../../_utils";
import { RebuildRequiredWarning } from "../../_components/RebuildRequiredWarning";
import { UPLOAD_CHUNK_SIZE_BYTES, parseStorageIdResponse } from "../_utils";

/** Config files section for uploading files to be baked into snapshots. */
export function ConfigFilesTab({
  repoId,
  snapshotId,
}: {
  repoId: Id<"githubRepos">;
  snapshotId?: Id<"repoSnapshots">;
}) {
  const files = useQuery(api.sandboxConfigFiles.list, { repoId });
  const generateUploadUrl = useMutation(
    api.sandboxConfigFiles.generateUploadUrl,
  );
  const saveFile = useMutation(api.sandboxConfigFiles.save);
  const removeFile = useMutation(api.sandboxConfigFiles.remove);
  const startBuild = useMutation(api.repoSnapshots.startBuild);

  const [uploading, setUploading] = useState(false);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const totalChunks = Math.max(
      1,
      Math.ceil(file.size / UPLOAD_CHUNK_SIZE_BYTES),
    );

    setUploading(true);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setChunkIndex(0);
    setChunkCount(totalChunks);
    setError(null);

    let uploadError: Error | undefined;
    // Built before the try: React Compiler bails on the whole file when a
    // logical expression sits inside a try/catch.
    const contentType = file.type || "application/octet-stream";
    // Upload each chunk: fresh upload URL per chunk, POST the slice, collect
    // storage IDs. Sequential keeps memory bounded and progress monotonic;
    // parallelism would only help for many small chunks, which isn't our case.
    //
    // Declared outside the try and called from inside it — errors still reach
    // the same catch — because React Compiler bails on the whole file when a
    // loop sits inside a try/catch. It reports failures via uploadError, same
    // as when the loop was inline.
    const uploadChunks = async () => {
      const ids: Id<"_storage">[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const start = i * UPLOAD_CHUNK_SIZE_BYTES;
        const end = Math.min(start + UPLOAD_CHUNK_SIZE_BYTES, file.size);
        const chunk = file.slice(start, end);
        setChunkIndex(i + 1);

        const uploadUrl = await generateUploadUrl({ repoId });
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": contentType },
          body: chunk,
        });
        const responseText = await result.text();
        if (!result.ok) {
          uploadError = new Error(
            `Upload failed at chunk ${i + 1}/${totalChunks} (status ${result.status}): ${responseText}`,
          );
          break;
        }
        const storageId = parseStorageIdResponse(responseText);
        if (!storageId) {
          uploadError = new Error(
            `Invalid response from storage at chunk ${i + 1}/${totalChunks}`,
          );
          break;
        }
        ids.push(storageId);
        setUploadedBytes(end);
      }
      return ids;
    };

    try {
      const chunkIds = await uploadChunks();

      if (!uploadError) {
        // Save file record with all chunk IDs in order
        await saveFile({
          repoId,
          chunks: chunkIds,
          fileName: file.name,
          fileSize: file.size,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setUploading(false);
      setUploadedBytes(0);
      setTotalBytes(0);
      setChunkIndex(0);
      setChunkCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    if (uploadError) {
      setError(uploadError.message);
    }
    setUploading(false);
    setUploadedBytes(0);
    setTotalBytes(0);
    setChunkIndex(0);
    setChunkCount(0);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRebuild = async () => {
    if (!snapshotId) return;
    try {
      await startBuild({ repoSnapshotId: snapshotId, appRepoId: repoId });
    } catch {
      // Error shown via build status
    }
  };

  return (
    <div className="space-y-4">
      <RebuildRequiredWarning />

      <SettingsSection
        title={
          <>
            Sandbox Config Files{" "}
            <span className="font-normal text-muted-foreground">
              (optional — seeded snapshots only)
            </span>
          </>
        }
        description={
          <>
            Files uploaded here are copied into the codebase root when a sandbox
            starts. They are also available at{" "}
            <code>/home/eva/sandbox-config/</code> and{" "}
            <code>/tmp/sandbox-config/</code>. Only needed when app startup
            commands reference sensitive seeds (e.g. SQL dumps) that cannot live
            in git. Base Image rebuilds do not require any files here.
          </>
        }
        bodyClassName="space-y-4 px-4 py-4"
      >
        {error && (
          <div className="rounded-control border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="config-file-upload"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Spinner size="sm" className="mr-1.5" />
                {totalBytes === 0
                  ? "Preparing..."
                  : `Chunk ${chunkIndex}/${chunkCount} • ${formatFileSize(uploadedBytes)} / ${formatFileSize(totalBytes)}`}
              </>
            ) : (
              <>
                <IconUpload size={14} className="mr-1.5" />
                Upload File
              </>
            )}
          </Button>
          {snapshotId && files && files.length > 0 && (
            <Button size="sm" onClick={handleRebuild}>
              <IconPlayerPlay size={14} className="mr-1.5" />
              Rebuild Snapshot
            </Button>
          )}
        </div>

        {/* Files table */}
        {files && files.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-2 font-medium">File Name</th>
                  <th className="px-2 py-2 font-medium">Size</th>
                  <th className="px-2 py-2 font-medium">Uploaded</th>
                  <th className="px-2 py-2 font-medium w-10" />
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file._id} className="hover:bg-muted/30">
                    <td className="px-2 py-2 font-mono">{file.fileName}</td>
                    <td className="px-2 py-2">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="px-2 py-2">
                      {new Date(file.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile({ id: file._id })}
                        className="h-6 w-6 p-0"
                      >
                        <IconTrash size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : files && files.length === 0 ? (
          <SettingsEmptyState
            icon={IconFile}
            title="No config files yet"
            description="Upload files to include in snapshot builds."
          />
        ) : (
          <div className="flex items-center justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
