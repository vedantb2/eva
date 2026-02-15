import { Suspense } from "react";
import { InboxClient } from "./InboxClient";

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxClient />
    </Suspense>
  );
}
