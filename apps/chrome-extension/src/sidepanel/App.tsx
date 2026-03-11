import { useEffect, useState, useCallback } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from "@clerk/chrome-extension";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { ConvexProvider } from "./ConvexProvider";
import { ChatPanel } from "./components/ChatPanel";
import { RepoSelector } from "./components/RepoSelector";
import { SessionSidebar } from "./components/SessionSidebar";
import {
  Button,
  Input,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@conductor/ui";
import {
  IconBolt,
  IconExternalLink,
  IconMenu2,
  IconPlus,
} from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";
import { type StoredPin, CONDUCTOR_URL } from "@/shared/messaging";
import type { Id } from "@conductor/backend";
import { useTheme } from "./hooks/useTheme";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExtractedContext(value: unknown): value is ExtractedContext {
  if (!isRecord(value)) return false;
  if (!isRecord(value.element) || !isRecord(value.metadata)) return false;
  return (
    typeof value.element.tagName === "string" &&
    typeof value.metadata.capturedAt === "number"
  );
}

function isStoredPinRecord(value: unknown): value is Record<string, StoredPin> {
  if (!isRecord(value)) return false;
  for (const v of Object.values(value)) {
    if (!isRecord(v) || typeof v.x !== "number" || typeof v.y !== "number")
      return false;
  }
  return true;
}

function AuthenticatedApp() {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const reposResult = useQuery(api.githubRepos.list, {});
  const repos = reposResult ?? [];
  const isLoadingRepos = reposResult === undefined;
  const [selectedRepoId, setSelectedRepoId] =
    useState<Id<"githubRepos"> | null>(null);
  const [capturedContexts, setCapturedContexts] = useState<ExtractedContext[]>(
    [],
  );
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] =
    useState<Id<"sessions"> | null>(null);
  const syncedToolbarVisible = useQuery(api.auth.getToolbarVisible);
  const toolbarVisible = syncedToolbarVisible === true;
  const setToolbarVisibleMutation = useMutation(api.auth.setToolbarVisible);
  const [pendingProjectPins, setPendingProjectPins] = useState<{
    pageUrl: string;
    pins: Record<string, StoredPin>;
  } | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] =
    useState<Id<"projects"> | null>(null);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  const convexUserId = useQuery(api.auth.me);
  const unreadCount = useQuery(api.notifications.countUnread, {});
  const creatorInitials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";

  const createSession = useMutation(api.sessions.create);
  const getOrCreateExtensionSession = useMutation(
    api.sessions.getOrCreateExtensionSession,
  );
  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const assignToProject = useMutation(api.agentTasks.assignToProject);
  const createFromTasks = useMutation(api.projects.createFromTasks);

  const projects = useQuery(
    api.projects.list,
    selectedRepoId ? { repoId: selectedRepoId } : "skip",
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
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) return;
    const next = !toolbarVisible;
    chrome.tabs.sendMessage(tab.id, {
      type: next ? "SHOW_TOOLBAR" : "HIDE_TOOLBAR",
    });
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
            repoId: selectedRepoId,
            title: pin.text.slice(0, 100) || `Annotation #${pin.number}`,
            description: buildDescription(pin, pageUrl),
          });
          created++;
        } catch (e) {
          console.error("Failed to create task:", e);
        }
      }
      sendToolbarResult(
        created > 0,
        `Created ${created} task${created !== 1 ? "s" : ""}`,
      );
    },
    [selectedRepoId, createQuickTask, buildDescription, sendToolbarResult],
  );

  const sendRunAllResult = useCallback((success: boolean, message: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "RUN_ALL_RESULT",
          payload: { success, message },
        });
      }
    });
  }, []);

  const handleRunAll = useCallback(
    async (pageUrl: string, pins: Record<string, StoredPin>) => {
      if (!selectedRepoId) return;
      const entries = Object.entries(pins);
      let created = 0;
      for (const [pinId, pin] of entries) {
        try {
          const taskId = await createQuickTask({
            repoId: selectedRepoId,
            title: pin.text.slice(0, 100) || `Annotation #${pin.number}`,
            description: buildDescription(pin, pageUrl),
          });
          chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab?.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: "ANNOTATION_TASK_CREATED",
                payload: {
                  pinId,
                  taskId: String(taskId),
                  userId: convexUserId ?? undefined,
                  creatorInitials,
                },
              });
            }
          });
          await startExecution({ id: taskId });
          created++;
        } catch (e) {
          console.error("Failed to run task:", e);
        }
      }
      sendRunAllResult(
        created > 0,
        `Created & running ${created} task${created !== 1 ? "s" : ""}`,
      );
    },
    [
      selectedRepoId,
      createQuickTask,
      startExecution,
      buildDescription,
      sendRunAllResult,
      convexUserId,
      creatorInitials,
    ],
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
          repoId: selectedRepoId,
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
            projectId: selectedProjectId,
          });
        } else if (newProjectTitle.trim()) {
          await createFromTasks({
            repoId: selectedRepoId,
            title: newProjectTitle.trim(),
            taskIds,
          });
        }
        sendToolbarResult(
          true,
          `Added ${taskIds.length} task${taskIds.length !== 1 ? "s" : ""} to project`,
        );
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
    pendingProjectPins,
    selectedRepoId,
    selectedProjectId,
    newProjectTitle,
    createQuickTask,
    assignToProject,
    createFromTasks,
    buildDescription,
    sendToolbarResult,
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
        const url = changeInfo.url;
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id === tabId) {
            setIsValidUrl(isAllowedUrl(url));
          }
        });
      }
    };
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    return () => chrome.tabs.onUpdated.removeListener(handleTabUpdate);
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["defaultRepoId"], (result) => {
      if (result.defaultRepoId && typeof result.defaultRepoId === "string") {
        setSelectedRepoId(result.defaultRepoId as Id<"githubRepos">);
      }
    });
  }, []);

  useEffect(() => {
    if (syncedToolbarVisible === undefined || syncedToolbarVisible === null)
      return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: syncedToolbarVisible ? "SHOW_TOOLBAR" : "HIDE_TOOLBAR",
        });
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
        const captured = message.payload;
        if (isExtractedContext(captured)) {
          setCapturedContexts((prev) => [...prev, captured]);
        }
      }
      if (message.type === "REQUEST_TOOLBAR_STATE") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id && syncedToolbarVisible) {
            chrome.tabs.sendMessage(tab.id, { type: "SHOW_TOOLBAR" });
          }
        });
      }
      if (message.type === "TOOLBAR_ADD_QUICK_TASKS" && message.payload) {
        const payload = message.payload;
        if (
          isRecord(payload) &&
          typeof payload.pageUrl === "string" &&
          isRecord(payload.pins) &&
          isStoredPinRecord(payload.pins)
        ) {
          handleAddAllQuickTasks(payload.pageUrl, payload.pins);
        }
      }
      if (message.type === "TOOLBAR_ADD_TO_PROJECT" && message.payload) {
        const payload = message.payload;
        if (
          isRecord(payload) &&
          typeof payload.pageUrl === "string" &&
          isRecord(payload.pins) &&
          isStoredPinRecord(payload.pins)
        ) {
          setPendingProjectPins({
            pageUrl: payload.pageUrl,
            pins: payload.pins,
          });
        }
      }
      if (message.type === "RUN_ALL_ANNOTATIONS" && message.payload) {
        const payload = message.payload;
        if (
          isRecord(payload) &&
          typeof payload.pageUrl === "string" &&
          isRecord(payload.pins) &&
          isStoredPinRecord(payload.pins)
        ) {
          handleRunAll(payload.pageUrl, payload.pins);
        }
      }
      if (message.type === "RUN_ANNOTATION_TASK" && message.payload) {
        const payload = message.payload;
        if (isRecord(payload) && typeof payload.taskId === "string") {
          (async () => {
            try {
              await startExecution({
                id: payload.taskId as Id<"agentTasks">,
              });
            } catch (e) {
              console.error("Failed to run annotation task:", e);
            }
          })();
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [
    handleAddAllQuickTasks,
    handleRunAll,
    startExecution,
    syncedToolbarVisible,
  ]);

  useEffect(() => {
    if (selectedRepoId && user?.id) {
      getOrCreateExtensionSession({
        repoId: selectedRepoId,
      }).then((result) => setCurrentSessionId(result.id));
    }
  }, [selectedRepoId, user?.id, getOrCreateExtensionSession]);

  const handleRepoChange = (repoId: string) => {
    const typedId = repoId as Id<"githubRepos">;
    setSelectedRepoId(typedId);
    setCurrentSessionId(null);
    chrome.storage.local.set({ defaultRepoId: repoId });
  };

  const handleClearContext = (index?: number) => {
    if (index === undefined) {
      setCapturedContexts([]);
    } else {
      setCapturedContexts((prev) => prev.filter((_, i) => i !== index));
    }
    chrome.runtime.sendMessage({ type: "CLEAR_CONTEXT" });
  };

  const handleNewSession = async () => {
    if (!selectedRepoId) return;
    const sessionId = await createSession({
      repoId: selectedRepoId,
      title: `Session ${new Date().toLocaleDateString()}`,
    });
    setCurrentSessionId(sessionId);
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId as Id<"sessions">);
  };

  const handleOpenInConductor = () => {
    const selectedRepo = repos.find((r) => r._id === selectedRepoId);
    if (!selectedRepo) return;
    const base = `${CONDUCTOR_URL}/${selectedRepo.owner}/${selectedRepo.name}`;
    const url = currentSessionId
      ? `${base}/sessions/${currentSessionId}`
      : base;
    chrome.tabs.create({ url });
  };

  if (isValidUrl === null || isLoadingRepos) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Spinner />
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
              className="relative"
            >
              <IconMenu2 size={20} />
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sessions</TooltipContent>
        </Tooltip>
        <RepoSelector
          repos={repos}
          selectedRepoId={selectedRepoId}
          onRepoChange={handleRepoChange}
        />
        <div className="ml-auto flex items-center gap-1">
          {selectedRepoId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenInConductor}
                >
                  <IconExternalLink size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in Conductor</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleNewSession}>
                <IconPlus size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New session</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {pendingProjectPins && (
        <div className="border-b border-border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Add {Object.keys(pendingProjectPins.pins).length} annotations to
              project
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPendingProjectPins(null);
                setNewProjectTitle("");
                setSelectedProjectId(null);
              }}
            >
              Cancel
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="New project title..."
              value={newProjectTitle}
              onChange={(e) => {
                setNewProjectTitle(e.target.value);
                setSelectedProjectId(null);
              }}
              className="text-sm"
            />
            {projects && projects.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                <p className="text-xs text-muted-foreground">
                  Or pick existing:
                </p>
                {projects
                  .filter((p) => p.phase !== "completed")
                  .map((project) => (
                    <Button
                      key={project._id}
                      variant={
                        selectedProjectId === project._id ? "default" : "ghost"
                      }
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSelectedProjectId(project._id);
                        setNewProjectTitle("");
                      }}
                    >
                      {project.title}
                      <span className="ml-2 text-xs opacity-60">
                        {project.phase}
                      </span>
                    </Button>
                  ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            disabled={
              isCreatingTasks || (!newProjectTitle.trim() && !selectedProjectId)
            }
            onClick={handleConfirmProject}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
        convexUserId={convexUserId ?? undefined}
        creatorInitials={creatorInitials}
      />

      {selectedRepoId && (
        <SessionSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          repoId={selectedRepoId}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          afterSignOutUrl={`${EXTENSION_URL}/sidepanel.html`}
          theme={theme}
          onToggleTheme={toggleTheme}
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
