import { Suspense } from "react";
import { RepoSetupClient } from "./RepoSetupClient";

export default async function RepoSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <RepoSetupClient installationId={id} />
    </Suspense>
  );
}
