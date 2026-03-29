"use client";

import {
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemDescription,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
} from "@conductor/ui";

interface QueuedMessageItem {
  id: string;
  content: string;
  description?: string;
}

interface QueuedMessagesPanelProps {
  items: QueuedMessageItem[];
  label?: string;
}

export function QueuedMessagesPanel({
  items,
  label = "Queued",
}: QueuedMessagesPanelProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Queue className="mb-2">
      <QueueSection defaultOpen>
        <QueueSectionTrigger>
          <QueueSectionLabel count={items.length} label={label} />
        </QueueSectionTrigger>
        <QueueSectionContent>
          <QueueList>
            {items.map((item) => (
              <QueueItem key={item.id}>
                <QueueItemIndicator />
                <QueueItemContent>
                  <div className="whitespace-pre-wrap break-words">
                    {item.content}
                  </div>
                  {item.description ? (
                    <QueueItemDescription>
                      {item.description}
                    </QueueItemDescription>
                  ) : null}
                </QueueItemContent>
              </QueueItem>
            ))}
          </QueueList>
        </QueueSectionContent>
      </QueueSection>
    </Queue>
  );
}
