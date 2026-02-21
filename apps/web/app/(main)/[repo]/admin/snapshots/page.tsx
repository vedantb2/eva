import { PageWrapper } from "@/lib/components/PageWrapper";
import { SnapshotsClient } from "./SnapshotsClient";

export default function SnapshotsPage() {
  return (
    <PageWrapper title="Snapshots">
      <SnapshotsClient />
    </PageWrapper>
  );
}
