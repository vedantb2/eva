"use client";

import { Spinner } from "@conductor/ui";
import type { Id } from "@conductor/backend";
import type { BlockProps } from "../types";
import { useDocImageUrl, useImageUpload } from "../useImageUpload";

export function ImageBlock({
  blockId,
  data,
  readOnly,
  onChange,
  docId,
}: BlockProps<"image"> & { docId: Id<"docs"> }) {
  const imageUrl = useDocImageUrl(docId, data.storageId);
  const { uploadImage } = useImageUpload(docId);

  if (readOnly) {
    if (!data.storageId) {
      return (
        <div className="rounded-surface border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No image
        </div>
      );
    }
    if (imageUrl === undefined) {
      return (
        <div className="flex justify-center rounded-surface border border-border p-6">
          <Spinner size="sm" />
        </div>
      );
    }
    if (!imageUrl) {
      return (
        <div className="rounded-surface border border-border p-6 text-center text-sm text-muted-foreground">
          Image unavailable
        </div>
      );
    }
    return (
      <figure className="rounded-surface border border-border p-2">
        <img
          src={imageUrl}
          alt={data.alt ?? ""}
          style={data.width ? { width: `${data.width}px` } : undefined}
          className="mx-auto max-w-full rounded-surface"
        />
        {data.alt ? (
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">
            {data.alt}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <div className="space-y-2 rounded-surface border border-border p-3">
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const storageId = await uploadImage(file);
          onChange({ ...data, storageId });
        }}
      />
      <label className="text-xs text-muted-foreground">
        Alt text
        <input
          className="mt-1 w-full rounded-surface border border-border bg-background px-2 py-1 text-sm"
          value={data.alt ?? ""}
          onChange={(event) => onChange({ ...data, alt: event.target.value })}
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Width (px)
        <input
          type="number"
          className="mt-1 w-full rounded-surface border border-border bg-background px-2 py-1 text-sm"
          value={data.width ?? ""}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange({
              ...data,
              width: Number.isFinite(parsed) ? parsed : undefined,
            });
          }}
        />
      </label>
      {data.storageId && imageUrl ? (
        <img
          src={imageUrl}
          alt={data.alt ?? ""}
          className="max-h-48 rounded-surface border border-border object-contain"
        />
      ) : null}
      <p className="text-[10px] text-muted-foreground">Block id: {blockId}</p>
    </div>
  );
}
