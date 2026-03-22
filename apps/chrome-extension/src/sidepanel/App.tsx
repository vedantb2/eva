import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  useUser,
} from "@clerk/chrome-extension";
import {
  Authenticated,
  AuthLoading,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "@conductor/backend";
import { ConvexProvider } from "./ConvexProvider";
import { ChatPanel } from "./components/ChatPanel";
import { RepoSelector } from "./components/RepoSelector";
import { SessionSidebar } from "./components/SessionSidebar";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  type StoredPin,
  EVA_URL,
  isSessionId,
  isRepoId,
  isTaskId,
  sendTabMessage,
} from "@/shared/messaging";
import type { Id } from "@conductor/backend";
import { useTheme } from "./hooks/useTheme";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment");
}

const EXTENSION_URL = chrome.runtime.getURL(".");
const SYNC_HOST = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://eva-git-staging-vedantb.vercel.app";

function getHostFromUrl(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function domainMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function findBestMatchingRepo(
  host: string,
  domainToRepoId: Map<string, Id<"githubRepos">>,
): Id<"githubRepos"> | null {
  let bestMatch: { domain: string; repoId: Id<"githubRepos"> } | null = null;
  for (const [domain, repoId] of domainToRepoId) {
    if (
      domainMatches(host, domain) &&
      (!bestMatch || domain.length > bestMatch.domain.length)
    ) {
      bestMatch = { domain, repoId };
    }
  }
  return bestMatch?.repoId ?? null;
}

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

  const domainToRepoId = useMemo(() => {
    const map = new Map<string, Id<"githubRepos">>();
    for (const repo of repos) {
      if (repo.domains) {
        for (const raw of repo.domains) {
          let hostname = raw;
          try {
            const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
            hostname = url.hostname;
          } catch {
            // already a plain hostname
          }
          map.set(hostname, repo._id);
        }
      }
    }
    return map;
  }, [repos]);

  const [selectedRepoId, setSelectedRepoId] =
    useState<Id<"githubRepos"> | null>(null);
  const [capturedContexts, setCapturedContexts] = useState<ExtractedContext[]>(
    [],
  );
  const [currentTabHost, setCurrentTabHost] = useState<string | null>(null);
  const [dismissedSuggestion, setDismissedSuggestion] =
    useState<Id<"githubRepos"> | null>(null);

  const suggestedRepoId = useMemo(() => {
    if (!currentTabHost) return null;
    const matchedRepoId = findBestMatchingRepo(currentTabHost, domainToRepoId);
    if (!matchedRepoId) return null;
    const exists = repos.some((r) => r._id === matchedRepoId);
    if (!exists) return null;
    return matchedRepoId;
  }, [currentTabHost, domainToRepoId, repos]);

  const suggestedRepo =
    suggestedRepoId &&
    suggestedRepoId !== selectedRepoId &&
    dismissedSuggestion !== suggestedRepoId
      ? repos.find((r) => r._id === suggestedRepoId)
      : null;

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
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");

  const convexUserId = useQuery(api.auth.me);
  const unreadCount = useQuery(api.notifications.countUnread, {});
  const creatorInitials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";

  const createSession = useMutation(api.sessions.create);
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
        sendTabMessage(tab.id, {
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
    sendTabMessage(tab.id, {
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
        sendTabMessage(tab.id, {
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
              sendTabMessage(tab.id, {
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

  const handleRepoChange = useCallback(
    (repoId: Id<"githubRepos">) => {
      setSelectedRepoId(repoId);
      chrome.storage.local.set({ defaultRepoId: repoId });
      chrome.storage.local.get(["lastSessionByRepo"], (result) => {
        const map = isRecord(result.lastSessionByRepo)
          ? result.lastSessionByRepo
          : {};
        const saved = map[repoId];
        setCurrentSessionId(
          typeof saved === "string" && isSessionId(saved) ? saved : null,
        );
      });
    },
    [setSelectedRepoId, setCurrentSessionId],
  );

  useEffect(() => {
    const checkCurrentTab = async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const host = tab?.url ? getHostFromUrl(tab.url) : null;
      setCurrentTabHost(host);
      if (host) {
        const bestMatchRepoId = findBestMatchingRepo(host, domainToRepoId);
        if (bestMatchRepoId && !selectedRepoId) {
          handleRepoChange(bestMatchRepoId);
        }
      }
    };
    checkCurrentTab();

    const handleTabUpdate = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) => {
      if (changeInfo.url) {
        const host = getHostFromUrl(changeInfo.url);
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id === tabId && host) {
            setCurrentTabHost(host);
          }
        });
      }
    };

    const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        const host = tab?.url ? getHostFromUrl(tab.url) : null;
        setCurrentTabHost(host);
      });
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, [domainToRepoId, selectedRepoId, handleRepoChange]);

  useEffect(() => {
    chrome.storage.local.get(
      ["defaultRepoId", "lastSessionByRepo"],
      (result) => {
        const repoId = result.defaultRepoId;
        if (repoId && isRepoId(repoId)) {
          setSelectedRepoId(repoId);
          const map = isRecord(result.lastSessionByRepo)
            ? result.lastSessionByRepo
            : {};
          const saved = map[repoId];
          if (typeof saved === "string" && isSessionId(saved)) {
            setCurrentSessionId(saved);
          }
        }
      },
    );
  }, []);

  useEffect(() => {
    if (!selectedRepoId) return;
    chrome.storage.local.get(["lastSessionByRepo"], (result) => {
      const map = isRecord(result.lastSessionByRepo)
        ? { ...result.lastSessionByRepo }
        : {};
      if (currentSessionId) {
        map[selectedRepoId] = currentSessionId;
      } else {
        delete map[selectedRepoId];
      }
      chrome.storage.local.set({ lastSessionByRepo: map });
    });
  }, [currentSessionId, selectedRepoId]);

  useEffect(() => {
    if (syncedToolbarVisible === undefined || syncedToolbarVisible === null)
      return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        sendTabMessage(tab.id, {
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
            sendTabMessage(tab.id, { type: "SHOW_TOOLBAR" });
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
              if (isTaskId(payload.taskId)) {
                await startExecution({
                  id: payload.taskId,
                });
              }
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

  // No auto-session creation — user picks from sidebar or creates via "+" button

  const handleClearContext = (index?: number) => {
    if (index === undefined) {
      setCapturedContexts([]);
    } else {
      setCapturedContexts((prev) => prev.filter((_, i) => i !== index));
    }
    chrome.runtime.sendMessage({ type: "CLEAR_CONTEXT" });
  };

  const handleCreateSession = async () => {
    if (!selectedRepoId || !newSessionTitle.trim()) return;
    const sessionId = await createSession({
      repoId: selectedRepoId,
      title: newSessionTitle.trim(),
    });
    setCurrentSessionId(sessionId);
    setNewSessionTitle("");
    setIsCreateSessionOpen(false);
  };

  const handleSessionSelect = (sessionId: string) => {
    if (isSessionId(sessionId)) {
      setCurrentSessionId(sessionId);
    }
  };

  const handleGoHome = () => {
    setCurrentSessionId(null);
  };

  const handleOpenInEva = () => {
    const selectedRepo = repos.find((r) => r._id === selectedRepoId);
    if (!selectedRepo) return;
    const base = `${EVA_URL}/${selectedRepo.owner}/${selectedRepo.name}`;
    const url = currentSessionId
      ? `${base}/sessions/${currentSessionId}`
      : base;
    chrome.tabs.create({ url });
  };

  if (isLoadingRepos) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Spinner />
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
                <Button variant="ghost" size="icon" onClick={handleOpenInEva}>
                  <IconExternalLink size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in Eva</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCreateSessionOpen(true)}
              >
                <IconPlus size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New session</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {suggestedRepo && (
        <div className="border-b border-border bg-muted/50 px-4 py-2 space-y-1.5">
          <p className="text-sm text-muted-foreground">
            This page matches{" "}
            <span className="font-medium text-foreground">
              {suggestedRepo.owner}/{suggestedRepo.name}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                handleRepoChange(suggestedRepo._id);
                setDismissedSuggestion(null);
              }}
            >
              Switch
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissedSuggestion(suggestedRepo._id)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

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
          onGoHome={handleGoHome}
          afterSignOutUrl={`${EXTENSION_URL}/sidepanel.html`}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Session</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new chat session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="session-title"
              className="text-sm font-medium text-foreground"
            >
              Session Title
            </label>
            <Input
              id="session-title"
              placeholder="e.g., Add user authentication"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSession();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateSessionOpen(false);
                setNewSessionTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={!newSessionTitle.trim()}
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SignInScreen() {
  const handleOpenWebApp = () => {
    chrome.tabs.create({ url: SYNC_HOST });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-6">
      <div className="flex items-center gap-3 mb-8">
        <IconBolt size={48} className="text-primary" />
        <span className="text-2xl font-bold">Eva Assist</span>
      </div>

      <p className="text-muted-foreground text-center mb-8 max-w-xs">
        Sign in on the Eva web app to use the extension. Your session will sync
        automatically.
      </p>

      <Button size="lg" onClick={handleOpenWebApp}>
        Open Eva
      </Button>
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
      syncHost={SYNC_HOST}
    >
      <ConvexProvider>
        <TooltipProvider>
          <SignedOut>
            <SignInScreen />
          </SignedOut>
          <SignedIn>
            <AuthLoading>
              <div className="flex items-center justify-center h-screen bg-background">
                <Spinner />
              </div>
            </AuthLoading>
            <Authenticated>
              <AuthenticatedApp />
            </Authenticated>
          </SignedIn>
        </TooltipProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}
