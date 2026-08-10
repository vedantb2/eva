import { useLocalStorage } from "usehooks-ts";

const STORAGE_VERSION = 1;

export function useChangedFilesExpansion(conversationId: string) {
  const [expandedByMessageId, setExpandedByMessageId] = useLocalStorage<
    Record<string, boolean>
  >(`eva:chat-changed-files:v${STORAGE_VERSION}:${conversationId}`, {});

  const setMessageExpanded = (messageId: string, expanded: boolean) => {
    setExpandedByMessageId((current) => ({
      ...current,
      [messageId]: expanded,
    }));
  };

  return { expandedByMessageId, setMessageExpanded };
}
