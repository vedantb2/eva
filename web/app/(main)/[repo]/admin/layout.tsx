"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRepo } from "@/lib/contexts/RepoContext";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { IconServer2, IconLayoutDashboard, IconChartBar } from "@tabler/icons-react";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName } = useRepo();
  const pathname = usePathname();
  const baseUrl = "/" + encodeRepoSlug(fullName) + "/admin";

  const navigation = [
    { name: "Overview", href: baseUrl, icon: IconLayoutDashboard },
    { name: "Stats", href: baseUrl + "/stats", icon: IconChartBar },
  ];

  return (
    <SidebarLayoutWrapper
      title="Admin"
      sidebar={
        <nav className="flex-1 p-2 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== baseUrl && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-teal-600" : ""}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      }
    >
      {children}
    </SidebarLayoutWrapper>
  );
}
