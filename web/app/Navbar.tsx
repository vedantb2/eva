"use client";

import {
  IconMenu2,
  IconX,
  IconHome,
  IconHomeFilled,
  IconBook,
  IconBookFilled,
  IconVocabulary,
  IconBuildingCommunity,
  IconCalendar,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "../lib/components/LoadingScreen";
import { UserButton } from "@clerk/nextjs";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { IconSettings, IconMoon, IconSun, IconHelp } from "@tabler/icons-react";

const navigation = [
  { name: "Learn", href: "/learn", icon: IconHome, activeIcon: IconHomeFilled },
  { name: "Practice", href: "/practice", icon: IconBook, activeIcon: IconBookFilled },
  { name: "Vocabulary", href: "/vocabulary", icon: IconVocabulary },
  { name: "Culture", href: "/culture", icon: IconBuildingCommunity },
  { name: "Calendar", href: "/calendar", icon: IconCalendar },
];

export function Navbar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useThemeContext();

  useEffect(() => {
    navigation.map((item) => router.prefetch(item.href));
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <button
          type="button"
          className="group inline-flex items-center justify-center rounded-xl p-3 transition-all duration-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          <div className="relative">
            {sidebarOpen ? (
              <IconX
                className="block h-5 w-5 transition-transform duration-200 group-hover:scale-110 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100"
                aria-hidden="true"
              />
            ) : (
              <IconMenu2
                className="block h-5 w-5 transition-transform duration-200 group-hover:scale-110 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100"
                aria-hidden="true"
              />
            )}
          </div>
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 transition-all duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex h-full flex-col p-6">
          {/* Logo */}
          <div className="mb-10">
            <Link
              href="/"
              className="group flex items-center gap-3 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl">
                🤖
              </div>
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-all duration-200">
                Conductor
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const Icon =
                item.activeIcon && pathname === item.href
                  ? item.activeIcon
                  : item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-dmSans-semibold transition-all duration-200 ${
                    isActive
                      ? ""
                      : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={`flex items-center justify-center transition-all duration-200 ${
                      isActive ? "transform scale-110" : ""
                    }`}
                  >
                    <Icon
                      size={isActive ? 23 : 20}
                      style={isActive ? { color: "#16a34a" } : {}}
                      className={`transition-all duration-200 ${
                        isActive ? "" : "group-hover:scale-110"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-dmSans-semibold tracking-wide transition-all duration-200 ${
                      isActive ? "text-neutral-900 dark:text-neutral-100" : ""
                    }`}
                    style={isActive ? { letterSpacing: "-0.2px" } : {}}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Contextual Tools */}
          <div className="mt-8 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-dmSans-semibold transition-all duration-200 w-full text-left text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <div className="flex items-center justify-center">
                {theme === "dark" ? (
                  <IconSun
                    size={20}
                    className="transition-all duration-200 group-hover:scale-110"
                  />
                ) : (
                  <IconMoon
                    size={20}
                    className="transition-all duration-200 group-hover:scale-110"
                  />
                )}
              </div>
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-dmSans-semibold transition-all duration-200 ${
                pathname === "/settings"
                  ? "text-green-600"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <div className="flex items-center justify-center">
                <IconSettings
                  size={20}
                  style={pathname === "/settings" ? { color: "#16a34a" } : {}}
                  className={`transition-all duration-200 ${
                    pathname === "/settings"
                      ? "transform scale-110"
                      : "group-hover:scale-110"
                  }`}
                />
              </div>
              <span
                className={
                  pathname === "/settings"
                    ? "text-neutral-900 dark:text-neutral-100"
                    : ""
                }
              >
                Settings
              </span>
            </Link>

            {/* Help */}
            <button
              onClick={() => {
                // TODO: Open help modal or navigate to help page
                console.log("Help clicked");
                setSidebarOpen(false);
              }}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-dmSans-semibold transition-all duration-200 w-full text-left text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <div className="flex items-center justify-center">
                <IconHelp
                  size={20}
                  className="transition-all duration-200 group-hover:scale-110"
                />
              </div>
              <span>Help & Support</span>
            </button>
          </div>

          {/* User section */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            {/* User Button */}
            <div className="flex justify-center">
              <UserButton
                showName
                appearance={{
                  elements: {
                    userButtonOuterIdentifier: {
                      color: theme === "dark" ? "#e7e5e4" : "#1c1917",
                      fontWeight: "normal",
                      fontFamily: "DMSans",
                    },
                    userButtonBox: {
                      background: "transparent",
                      shadow: "none",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
