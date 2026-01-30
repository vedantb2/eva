import { IconBell } from "@tabler/icons-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <IconBell
        size={32}
        className="text-neutral-300 dark:text-neutral-600 mb-2"
      />
      <p className="text-sm text-neutral-500">
        Select a notification to view details
      </p>
    </div>
  );
}
