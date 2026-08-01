import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

const COOKIE_NAME = "sidebar-collapsed";
const ONE_YEAR = 60 * 60 * 24 * 365;
const SESSIONS_NAV_MODE_KEY = "eva-sessions-nav-mode";
const SIDEBAR_WIDTH_KEY = "eva-sidebar-width";

/** Matches previous `lg:w-80` default for rail + secondary panel. */
const SIDEBAR_DEFAULT_WIDTH_PX = 320;
/** Narrow enough to reclaim canvas; still fits nav labels. */
export const SIDEBAR_MIN_WIDTH_PX = 240;
/** Caps growth so chat/canvas keep usable space on laptop widths. */
export const SIDEBAR_MAX_WIDTH_PX = 480;

export type SessionsNavMode = "global" | "repo";

function readCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_NAME}=true`);
}

function writeCookie(collapsed: boolean) {
  document.cookie = `${COOKIE_NAME}=${collapsed}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

function clampSidebarWidth(width: number): number {
  return Math.min(
    SIDEBAR_MAX_WIDTH_PX,
    Math.max(SIDEBAR_MIN_WIDTH_PX, Math.round(width)),
  );
}

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Sticky entry point for Sessions: rail → global list, in-repo nav → per-repo list. */
  sessionsNavMode: SessionsNavMode;
  setSessionsNavMode: (mode: SessionsNavMode) => void;
  /**
   * Desktop width (px) of the fixed left chrome when the secondary panel is
   * open — icon rail + app/repo or sessions column. Persisted across routes.
   */
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(readCookie);
  const [sessionsNavMode, setSessionsNavMode] =
    useSessionStorage<SessionsNavMode>(SESSIONS_NAV_MODE_KEY, "repo");
  const [sidebarWidth, setSidebarWidthState] = useLocalStorage(
    SIDEBAR_WIDTH_KEY,
    SIDEBAR_DEFAULT_WIDTH_PX,
  );

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    writeCookie(value);
  };

  const clampedWidth = clampSidebarWidth(sidebarWidth);

  const setSidebarWidth = (width: number) => {
    setSidebarWidthState(clampSidebarWidth(width));
  };

  const cssVars: CSSProperties & Record<`--${string}`, string> = {
    "--eva-sidebar-width": `${clampedWidth}px`,
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        sessionsNavMode,
        setSessionsNavMode,
        sidebarWidth: clampedWidth,
        setSidebarWidth,
      }}
    >
      <div className="contents" style={cssVars}>
        {children}
      </div>
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
