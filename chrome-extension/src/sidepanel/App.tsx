import { useEffect, useState, useCallback } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from "@clerk/chrome-extension";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { ConvexProvider } from "./ConvexProvider";
import { ChatPanel } from "./components/ChatPanel";
import { RepoSelector } from "./components/RepoSelector";
import { SessionSidebar } from "./components/SessionSidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { IconSun, IconMoon, IconBolt, IconMenu2 } from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";
import type { StoredPin } from "@/shared/messaging";
import { GenericId as Id } from "convex/values";

function useTheme() {
  const syncedTheme = useQuery(api.auth.getTheme);
  const setThemeMutation = useMutation(api.auth.setTheme);
  const theme = syncedTheme ?? "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeMutation({ theme: next });
  };

  return { theme, toggleTheme };
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  );
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

const EXTENSION_URL = chrome.runtime.getURL(".");

const ALLOWED_HOSTS = [
  "localhost:3000",
  "localhost:3001",
  "carepulse.co.uk",
  "staging.carepulse.co.uk",
  "eprocurement.carepulse.co.uk",
];

const isAllowedUrl = (url: string) => {
  try {
    const { host } = new URL(url);
    return ALLOWED_HOSTS.includes(host) || host.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

function AuthenticatedApp() {
  const { user } = useUser();
  const repos = useQuery(api.githubRepos.list) ?? [];
  const isLoadingRepos = repos === undefined;
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [capturedContexts, setCapturedContexts] = useState<ExtractedContext[]>([]);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const syncedToolbarVisible = useQuery(api.auth.getToolbarVisible);
  const toolbarVisible = syncedToolbarVisible === true;
  const setToolbarVisibleMutation = useMutation(api.auth.setToolbarVisible);
  const [pendingProjectPins, setPendingProjectPins] = useState<{
    pageUrl: string;
    pins: Record<string, StoredPin>;
  } | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  const createSession = useMutation(api.sessions.create);
  const getOrCreateExtensionSession = useMutation(
    api.sessions.getOrCreateExtensionSession,
  );
  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const assignToProject = useMutation(api.agentTasks.assignToProject);
  const createFromTasks = useMutation(api.projects.createFromTasks);

  const projects = useQuery(
    api.projects.list,
    selectedRepoId ? { repoId: selectedRepoId as Id<"githubRepos"> } : "skip",
  );

  const sendToolbarResult = useCallback((success: boolean, message: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "TOOLBAR_RESULT",
          payload: { success, message },
        });
      }
    });
  }, []);

  const toggleToolbar = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const next = !toolbarVisible;
    chrome.tabs.sendMessage(tab.id, { type: next ? "SHOW_TOOLBAR" : "HIDE_TOOLBAR" });
    setToolbarVisibleMutation({ visible: next });
  }, [toolbarVisible, setToolbarVisibleMutation]);

  const buildDescription = useCallback((pin: StoredPin, pageUrl: string) => {
    let desc = `${pin.text}\n\n**Page:** ${pageUrl}`;
    if (pin.selector) desc += `\n**Selector:** \`${pin.selector}\``;
    if (pin.selectedText) desc += `\n**Selected text:** ${pin.selectedText}`;
    return desc;
  }, []);

  const handleAddAllQuickTasks = useCallback(
    async (pageUrl: string, pins: Record<string, StoredPin>) => {
      if (!selectedRepoId) return;
      const entries = Object.values(pins);
      let created = 0;
      for (const pin of entries) {
        try {
          await createQuickTask({
            repoId: selectedRepoId as Id<"githubRepos">,
            title: pin.text.slice(0, 100) || `Annotation #${pin.number}`,
            description: buildDescription(pin, pageUrl),
          });
          created++;
        } catch (e) {
          console.error("Failed to create task:", e);
        }
      }
      sendToolbarResult(created > 0, `Created ${created} task${created !== 1 ? "s" : ""}`);
    },
    [selectedRepoId, createQuickTask, buildDescription, sendToolbarResult],
  );

  const handleConfirmProject = useCallback(async () => {
    if (!pendingProjectPins || !selectedRepoId) return;
    setIsCreatingTasks(true);
    const { pageUrl, pins } = pendingProjectPins;
    const entries = Object.values(pins);
    const taskIds: Id<"agentTasks">[] = [];
    for (const pin of entries) {
      try {
        const id = await createQuickTask({
          repoId: selectedRepoId as Id<"githubRepos">,
          title: pin.text.slice(0, 100) || `Annotation #${pin.number}`,
          description: buildDescription(pin, pageUrl),
        });
        taskIds.push(id);
      } catch (e) {
        console.error("Failed to create task:", e);
      }
    }
    if (taskIds.length > 0) {
      try {
        if (selectedProjectId) {
          await assignToProject({
            taskIds,
            projectId: selectedProjectId as Id<"projects">,
          });
        } else if (newProjectTitle.trim()) {
          await createFromTasks({
            repoId: selectedRepoId as Id<"githubRepos">,
            title: newProjectTitle.trim(),
            taskIds,
          });
        }
        sendToolbarResult(true, `Added ${taskIds.length} task${taskIds.length !== 1 ? "s" : ""} to project`);
      } catch (e) {
        console.error("Failed to assign to project:", e);
        sendToolbarResult(false, "Failed to assign to project");
      }
    }
    setPendingProjectPins(null);
    setNewProjectTitle("");
    setSelectedProjectId(null);
    setIsCreatingTasks(false);
  }, [
    pendingProjectPins, selectedRepoId, selectedProjectId, newProjectTitle,
    createQuickTask, assignToProject, createFromTasks, buildDescription, sendToolbarResult,
  ]);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "sidepanel" });
    return () => port.disconnect();
  }, []);

  useEffect(() => {
    const checkCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      setIsValidUrl(tab?.url ? isAllowedUrl(tab.url) : false);
    };
    checkCurrentTab();

    const handleTabUpdate = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) => {
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
    if (syncedToolbarVisible === undefined || syncedToolbarVisible === null) return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: syncedToolbarVisible ? "SHOW_TOOLBAR" : "HIDE_TOOLBAR" });
      }
    });
  }, [syncedToolbarVisible]);

  useEffect(() => {
    if (!selectedRepoId && repos.length > 0) {
      setSelectedRepoId(repos[0]._id);
    }
  }, [repos, selectedRepoId]);

  useEffect(() => {
    const listener = (
      message: { type: string; payload?: Record<string, unknown> },
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) => {
      if (message.type === "ELEMENT_CAPTURED" && message.payload) {
        setCapturedContexts(prev => [...prev, message.payload as unknown as ExtractedContext]);
      }
      if (message.type === "REQUEST_TOOLBAR_STATE") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id && syncedToolbarVisible) {
            chrome.tabs.sendMessage(tab.id, { type: "SHOW_TOOLBAR" });
          }
        });
      }
      if (message.type === "TOOLBAR_ADD_QUICK_TASKS" && message.payload) {
        const { pageUrl, pins } = message.payload as unknown as {
          pageUrl: string;
          pins: Record<string, StoredPin>;
        };
        handleAddAllQuickTasks(pageUrl, pins);
      }
      if (message.type === "TOOLBAR_ADD_TO_PROJECT" && message.payload) {
        setPendingProjectPins(message.payload as unknown as {
          pageUrl: string;
          pins: Record<string, StoredPin>;
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [handleAddAllQuickTasks, syncedToolbarVisible]);


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

  const handleClearContext = (index?: number) => {
    if (index === undefined) {
      setCapturedContexts([]);
    } else {
      setCapturedContexts(prev => prev.filter((_, i) => i !== index));
    }
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
        <p className="text-xl text-muted-foreground text-center">
          Eva Assist is only supported on:
        </p>
        <ul className="mt-4 text-muted-foreground list-disc list-inside">
          {ALLOWED_HOSTS.map((host) => (
            <li key={host}>{host}</li>
          ))}
          <li>*.vercel.app</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu2 size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sessions</TooltipContent>
        </Tooltip>
        <RepoSelector
          repos={repos}
          selectedRepoId={selectedRepoId}
          onRepoChange={handleRepoChange}
        />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {pendingProjectPins && (
        <div className="border-b border-border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Add {Object.keys(pendingProjectPins.pins).length} annotations to project
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setPendingProjectPins(null); setNewProjectTitle(""); setSelectedProjectId(null); }}
            >
              Cancel
            </Button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="New project title..."
              value={newProjectTitle}
              onChange={(e) => { setNewProjectTitle(e.target.value); setSelectedProjectId(null); }}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {projects && projects.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                <p className="text-xs text-muted-foreground">Or pick existing:</p>
                {projects.filter((p) => p.phase !== "completed").map((project) => (
                  <button
                    key={project._id}
                    onClick={() => { setSelectedProjectId(project._id); setNewProjectTitle(""); }}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                      selectedProjectId === project._id
                        ? "bg-teal-600 text-white"
                        : "hover:bg-accent"
                    }`}
                  >
                    {project.title}
                    <span className="ml-2 text-xs opacity-60">{project.phase}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            disabled={isCreatingTasks || (!newProjectTitle.trim() && !selectedProjectId)}
            onClick={handleConfirmProject}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isCreatingTasks ? "Creating..." : "Confirm"}
          </Button>
        </div>
      )}

      <ChatPanel
        selectedRepoId={selectedRepoId}
        sessionId={currentSessionId}
        capturedContexts={capturedContexts}
        onClearContext={handleClearContext}
        toolbarVisible={toolbarVisible}
        onToggleToolbar={toggleToolbar}
      />

      {selectedRepoId && (
        <SessionSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          repoId={selectedRepoId}
          currentSessionId={currentSessionId}
          onSessionSelect={setCurrentSessionId}
          onNewSession={handleNewSession}
          afterSignOutUrl={`${EXTENSION_URL}/sidepanel.html`}
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
        <TooltipProvider>
          <SignedOut>
            <SignInScreen />
          </SignedOut>
          <SignedIn>
            <AuthenticatedApp />
          </SignedIn>
        </TooltipProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}
