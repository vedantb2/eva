"use client";

import { createContext, useContext, useState } from "react";
import { useSessionStorage } from "usehooks-ts";

const COOKIE_NAME = "sidebar-collapsed";
const ONE_YEAR = 60 * 60 * 24 * 365;
const SESSIONS_NAV_MODE_KEY = "eva-sessions-nav-mode";

export type SessionsNavMode = "global" | "repo";

function readCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_NAME}=true`);
}

function writeCookie(collapsed: boolean) {
  document.cookie = `${COOKIE_NAME}=${collapsed}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Sticky entry point for Sessions: rail → global list, in-repo nav → per-repo list. */
  sessionsNavMode: SessionsNavMode;
  setSessionsNavMode: (mode: SessionsNavMode) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(readCookie);
  const [sessionsNavMode, setSessionsNavMode] =
    useSessionStorage<SessionsNavMode>(SESSIONS_NAV_MODE_KEY, "repo");

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    writeCookie(value);
  };

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, sessionsNavMode, setSessionsNavMode }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
