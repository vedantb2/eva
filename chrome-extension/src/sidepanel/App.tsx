import { useEffect, useState } from "react";
import { AuthGate } from "./components/AuthGate";
import { ChatPanel } from "./components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Zap, LogOut } from "lucide-react";
import type { ExtractedContext, RepoInfo, UserInfo } from "@/shared/types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [capturedContext, setCapturedContext] =
    useState<ExtractedContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" }, (response) => {
      if (response) {
        setIsAuthenticated(response.isAuthenticated);
        setUser(response.user);
      }
      setIsLoading(false);
    });

    chrome.storage.local.get(["defaultRepoId"], (result) => {
      if (result.defaultRepoId) {
        setSelectedRepoId(result.defaultRepoId);
      }
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      chrome.runtime.sendMessage({ type: "GET_REPOS" }, (response) => {
        if (response?.success && response.repos) {
          setRepos(response.repos);
          if (!selectedRepoId && response.repos.length > 0) {
            setSelectedRepoId(response.repos[0]._id);
          }
        }
      });
    }
  }, [isAuthenticated, selectedRepoId]);

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
      if (message.type === "AUTH_SUCCESS") {
        setIsAuthenticated(true);
        chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" }, (response) => {
          if (response?.user) {
            setUser(response.user);
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleLogin = () => {
    chrome.runtime.sendMessage({ type: "LOGIN" });
  };

  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: "LOGOUT" }, () => {
      setIsAuthenticated(false);
      setUser(null);
      setRepos([]);
    });
  };

  const handleRepoChange = (repoId: string) => {
    setSelectedRepoId(repoId);
    chrome.storage.local.set({ defaultRepoId: repoId });
  };

  const handleClearContext = () => {
    setCapturedContext(null);
    chrome.runtime.sendMessage({ type: "CLEAR_CONTEXT" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGate onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <span className="font-semibold">Eva Assist</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-muted-foreground truncate max-w-[120px]">
              {user.email}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <ChatPanel
        repos={repos}
        selectedRepoId={selectedRepoId}
        onRepoChange={handleRepoChange}
        capturedContext={capturedContext}
        onClearContext={handleClearContext}
      />
    </div>
  );
}
