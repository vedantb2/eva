import { redirect } from "next/navigation";
import { decodeRepoParam } from "@/lib/utils/repoUrl";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const { name, appName } = decodeRepoParam(repo);
  const basePath = appName
    ? `/${owner}/${name}/${appName}`
    : `/${owner}/${name}`;
  redirect(`${basePath}/settings/config`);
}
