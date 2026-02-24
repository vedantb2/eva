import { redirect } from "next/navigation";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ repo: string }>;
}) {
  const { repo } = await params;
  redirect(`/${repo}/admin/stats`);
}
