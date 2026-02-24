import { redirect } from "next/navigation";

export default function AdminPage({ params }: { params: { repo: string } }) {
  redirect(`/${params.repo}/admin/stats`);
}
