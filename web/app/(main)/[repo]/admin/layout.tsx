"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRepo } from "@/lib/contexts/RepoContext";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { IconServer2, IconLayoutDashboard } from "@tabler/icons-react";

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
    { name: "Sandboxes", href: baseUrl + "/sandboxes", icon: IconServer2 },
  ];

  return (
    <div className="flex h-[calc(100vh-1.5rem)]">
      <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Admin
          </h2>
        </div>
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
                    ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-pink-600" : ""}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
