import { redirect } from "next/navigation";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  redirect(`/${owner}/${repo}/admin/stats`);
}
