"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  IconBrain,
  IconFolder,
  IconLayoutKanban,
  IconSettings,
  IconHistory,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";

const navigation = [
  { name: "Boards", href: "/boards", icon: IconLayoutKanban },
  { name: "Projects", href: "/projects", icon: IconFolder },
  { name: "History", href: "/history", icon: IconHistory },
  { name: "Settings", href: "/settings", icon: IconSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm"
      >
        <IconMenu2 className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-800">
            <Link href="/" className="flex items-center gap-2">
              <IconBrain className="w-8 h-8 text-pink-600" />
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">
                Conductor
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <IconX className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-pink-600" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  Account
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Manage settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
