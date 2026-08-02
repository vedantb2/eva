import { useState } from "react";
import { toast } from "@eva/ui";
import {
  iconForAttachment,
  isImageContentType,
  labelForAttachment,
} from "@/lib/components/attachments/attachmentMeta";
import { TextAttachmentModal } from "@/lib/components/attachments/TextAttachmentModal";

export type ChatAttachmentMeta = {
  url: string | null;
  contentType: string | null;
};

/** Renders a user message's attachments — image thumbs or text file chips. */
export function UserMessageAttachments({
  attachments,
}: {
  attachments?: ChatAttachmentMeta[];
}) {
  const [viewer, setViewer] = useState<{
    title: string;
    text: string;
  } | null>(null);

  const resolved = (attachments ?? []).filter(
    (item): item is { url: string; contentType: string | null } =>
      Boolean(item.url),
  );
  if (resolved.length === 0 && viewer === null) return null;

  return (
    <>
      {resolved.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {resolved.map((item) => {
            if (isImageContentType(item.contentType)) {
              return (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block size-24 overflow-hidden rounded-surface border border-border bg-muted"
                >
                  <img
                    src={item.url}
                    alt="Attached image"
                    className="size-full object-cover"
                  />
                </a>
              );
            }
            const FileIcon = iconForAttachment(undefined, item.contentType);
            const label = labelForAttachment(undefined, item.contentType);
            return (
              <button
                key={item.url}
                type="button"
                className="flex max-w-[14rem] items-center gap-2 rounded-surface border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/80"
                onClick={() => {
                  void (async () => {
                    try {
                      const response = await fetch(item.url);
                      if (!response.ok) {
                        toast.error("Could not load attachment.");
                        return;
                      }
                      const text = await response.text();
                      setViewer({ title: label, text });
                    } catch {
                      toast.error("Could not load attachment.");
                    }
                  })();
                }}
              >
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {viewer ? (
        <TextAttachmentModal
          title={viewer.title}
          text={viewer.text}
          readOnly
          onClose={() => setViewer(null)}
        />
      ) : null}
    </>
  );
}
