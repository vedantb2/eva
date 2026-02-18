import { UserProfile } from "@clerk/clerk-react";

export function SettingsPage() {
  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <h1 className="text-sm font-semibold text-foreground shrink-0">
        Settings
      </h1>
      <div className="flex-1 overflow-y-auto">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
