import { Suspense } from "react";
import { InboxClient } from "@/lib/components/inbox/InboxClient";

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxClient />
    </Suspense>
  );
}
