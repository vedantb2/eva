import { useEffect, useState } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/chrome-extension";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { ConvexProvider } from "./ConvexProvider";
import { ChatPanel } from "./components/ChatPanel";
import { RepoSelector } from "./components/RepoSelector";
import { SessionSidebar } from "./components/SessionSidebar";
import { Button } from "@/components/ui/button";
import { IconSun, IconMoon, IconBolt, IconMenu2 } from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";
import { GenericId as Id } from "convex/values";

function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("dark");

  useEffect(() => {
    chrome.storage.local.get(["theme"], (result) => {
      const savedTheme = result.theme === "light" ? "light" : "dark";
      setThemeState(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    });
  }, []);

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    chrome.storage.local.set({ theme: newTheme });
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return { theme, toggleTheme };
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
    </Button>
  );
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

const EXTENSION_URL = chrome.runtime.getURL(".");

const isAllowedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    if (host === "localhost:3000") return true;
    if (host.endsWith(".vercel.app")) return true;
    if (host === "vedantb.com" || host === "www.vedantb.com") return true;
    return false;
  } catch {
    return false;
  }
};

function AuthenticatedApp() {
  const { user } = useUser();
  const repos = useQuery(api.githubRepos.list) ?? [];
  const isLoadingRepos = repos === undefined;
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [capturedContext, setCapturedContext] =
    useState<ExtractedContext | null>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const createSession = useMutation(api.sessions.create);
  const getOrCreateExtensionSession = useMutation(api.sessions.getOrCreateExtensionSession);

  useEffect(() => {
    const checkCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      setIsValidUrl(tab?.url ? isAllowedUrl(tab.url) : false);
    };
    checkCurrentTab();

    const handleTabUpdate = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.url) {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id === tabId) {
            setIsValidUrl(isAllowedUrl(changeInfo.url!));
          }
        });
      }
    };
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    return () => chrome.tabs.onUpdated.removeListener(handleTabUpdate);
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["defaultRepoId"], (result) => {
      if (result.defaultRepoId) {
        setSelectedRepoId(result.defaultRepoId);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedRepoId && repos.length > 0) {
      setSelectedRepoId(repos[0]._id);
    }
  }, [repos, selectedRepoId]);

  useEffect(() => {
    const listener = (
      message: { type: string; payload?: ExtractedContext },
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void
    ) => {
      if (message.type === "ELEMENT_CAPTURED" && message.payload) {
        setCapturedContext(message.payload);
      }
      if (message.type === "SELECTION_CANCELLED") {
        setCapturedContext(null);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    if (selectedRepoId && user?.id) {
      getOrCreateExtensionSession({
        repoId: selectedRepoId as Id<"githubRepos">,
        clerkId: user.id,
      }).then((result) => setCurrentSessionId(result.id));
    }
  }, [selectedRepoId, user?.id, getOrCreateExtensionSession]);

  const handleRepoChange = (repoId: string) => {
    setSelectedRepoId(repoId);
    setCurrentSessionId(null);
    chrome.storage.local.set({ defaultRepoId: repoId });
  };

  const handleClearContext = () => {
    setCapturedContext(null);
    chrome.runtime.sendMessage({ type: "CLEAR_CONTEXT" });
  };

  const handleNewSession = async () => {
    if (!selectedRepoId) return;
    const sessionId = await createSession({
      repoId: selectedRepoId as Id<"githubRepos">,
      title: `Session ${new Date().toLocaleDateString()}`,
    });
    setCurrentSessionId(sessionId);
  };

  if (isValidUrl === null || isLoadingRepos) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isValidUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-6">
        <p className="text-muted-foreground text-center">
          This extension is only supported on:
        </p>
        <ul className="mt-4 text-sm text-muted-foreground list-disc list-inside">
          <li>localhost:3000</li>
          <li>*.vercel.app</li>
          <li>vedantb.com</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <IconMenu2 size={20} />
        </Button>
        <RepoSelector
          repos={repos}
          selectedRepoId={selectedRepoId}
          onRepoChange={handleRepoChange}
        />
        <div className="flex-1" />
        <ThemeToggle />
        <UserButton afterSignOutUrl={`${EXTENSION_URL}/sidepanel.html`} />
      </header>

      <ChatPanel
        selectedRepoId={selectedRepoId}
        sessionId={currentSessionId}
        capturedContext={capturedContext}
        onClearContext={handleClearContext}
      />

      {selectedRepoId && (
        <SessionSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          repoId={selectedRepoId}
          currentSessionId={currentSessionId}
          onSessionSelect={setCurrentSessionId}
          onNewSession={handleNewSession}
        />
      )}
    </div>
  );
}

function SignInScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-6">
      <div className="flex items-center gap-3 mb-8">
        <IconBolt size={48} className="text-primary" />
        <span className="text-2xl font-bold">Eva Assist</span>
      </div>

      <p className="text-muted-foreground text-center mb-8 max-w-xs">
        AI-powered assistant for asking questions and flagging issues in your
        codebase.
      </p>

      <SignInButton mode="modal">
        <Button size="lg">Sign in to continue</Button>
      </SignInButton>

      <p className="text-muted-foreground text-sm mt-6 text-center">
        Sign in with your account to get started
      </p>
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={`${EXTENSION_URL}/sidepanel.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}/sidepanel.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}/sidepanel.html`}
    >
      <ConvexProvider>
        <SignedOut>
          <SignInScreen />
        </SignedOut>
        <SignedIn>
          <AuthenticatedApp />
        </SignedIn>
      </ConvexProvider>
    </ClerkProvider>
  );
}
