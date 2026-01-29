import { IconFileText } from "@tabler/icons-react";

export default function DocsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 text-neutral-400">
      <IconFileText size={48} className="mb-3" />
      <p>Select a document to view</p>
    </div>
  );
}
