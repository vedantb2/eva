import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar p-6">
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none",
          },
        }}
      />
    </div>
  );
}
