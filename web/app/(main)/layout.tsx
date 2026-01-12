import { Sidebar } from "@/lib/components/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="pt-14 lg:pt-0 p-2 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
