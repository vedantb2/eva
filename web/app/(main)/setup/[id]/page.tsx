import { RepoSetupClient } from "./RepoSetupClient";

export default async function RepoSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RepoSetupClient installationId={id} />;
}
