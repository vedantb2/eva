import { useEffect, useState } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/chrome-extension";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { ConvexProvider } from "./ConvexProvider";
import { ChatPanel } from "./components/ChatPanel";
import { RepoSelector } from "./components/RepoSelector";
import { SelectionTool } from "./components/SelectionTool";
import { Button } from "@/components/ui/button";
import { IconSun, IconMoon, IconBolt } from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";

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

function AuthenticatedApp() {
  const repos = useQuery(api.githubRepos.list) ?? [];
  const isLoadingRepos = repos === undefined;
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [capturedContext, setCapturedContext] =
    useState<ExtractedContext | null>(null);

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

  const handleRepoChange = (repoId: string) => {
    setSelectedRepoId(repoId);
    chrome.storage.local.set({ defaultRepoId: repoId });
  };

  const handleClearContext = () => {
    setCapturedContext(null);
    chrome.runtime.sendMessage({ type: "CLEAR_CONTEXT" });
  };

  if (isLoadingRepos) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <SelectionTool />
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
        capturedContext={capturedContext}
        onClearContext={handleClearContext}
      />
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
