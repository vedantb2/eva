import { useState, useRef, useEffect } from "react";
import { RepoSelector } from "./RepoSelector";
import { SelectionTool } from "./SelectionTool";
import { ContextPreview } from "./ContextPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Send, Flag, MessageCircle } from "lucide-react";
import type { ExtractedContext, RepoInfo, SessionInfo } from "@/shared/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

type Mode = "ask" | "flag";

interface ChatPanelProps {
  repos: RepoInfo[];
  selectedRepoId: string | null;
  onRepoChange: (repoId: string) => void;
  capturedContext: ExtractedContext | null;
  onClearContext: () => void;
}

export function ChatPanel({
  repos,
  selectedRepoId,
  onRepoChange,
  capturedContext,
  onClearContext,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("ask");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedRepoId && mode === "ask") {
      setIsLoadingSession(true);
      chrome.runtime.sendMessage(
        { type: "GET_SESSION", payload: { repoId: selectedRepoId } },
        (response: { success: boolean; session?: SessionInfo; error?: string }) => {
          setIsLoadingSession(false);
          if (response?.success && response.session) {
            setSessionId(response.session.id);
            setMessages(
              response.session.messages.map((m, i) => ({
                id: `session-${i}`,
                role: m.role,
                content: m.content,
                timestamp: Date.now(),
              }))
            );
          }
        }
      );
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedRepoId, mode]);

  const pollForResponse = (currentSessionId: string, messageCount: number) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      chrome.runtime.sendMessage(
        { type: "GET_SESSION", payload: { repoId: selectedRepoId } },
        (response: { success: boolean; session?: SessionInfo }) => {
          if (response?.success && response.session) {
            if (response.session.messages.length > messageCount) {
              const newMessages = response.session.messages.slice(messageCount);
              const assistantMessages = newMessages.filter((m) => m.role === "assistant");
              if (assistantMessages.length > 0) {
                setMessages((prev) => [
                  ...prev.filter((m) => m.role !== "assistant" || !m.id.startsWith("loading")),
                  ...assistantMessages.map((m, i) => ({
                    id: `response-${Date.now()}-${i}`,
                    role: m.role,
                    content: m.content,
                    timestamp: Date.now(),
                  })),
                ]);
                setIsLoading(false);
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                }
              }
            }
          }
        }
      );
    }, 2000);

    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        setIsLoading(false);
      }
    }, 120000);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedRepoId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (mode === "flag") {
      try {
        const response = await new Promise<{ success: boolean; taskId?: string; error?: string }>(
          (resolve) => {
            chrome.runtime.sendMessage(
              {
                type: "CREATE_TASK",
                payload: {
                  repoId: selectedRepoId,
                  title: input.slice(0, 100),
                  description: input,
                  extensionContext: capturedContext,
                  sourceUrl: capturedContext?.metadata.sourceUrl || window.location.href,
                },
              },
              resolve
            );
          }
        );

        let assistantContent: string;
        if (response.success && response.taskId) {
          assistantContent = `Issue flagged successfully!${capturedContext ? "\n\nI've attached the captured React component context to the task." : ""}`;
          onClearContext();
        } else {
          assistantContent = `Failed to flag issue: ${response.error || "Unknown error"}`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: assistantContent,
            timestamp: Date.now(),
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!sessionId) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Session not available. Please try again.",
            timestamp: Date.now(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        const currentMessageCount = messages.length + 1;
        const response = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: "ASK_QUESTION",
              payload: { sessionId, message: input },
            },
            resolve
          );
        });

        if (!response.success) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Failed to send question: ${response.error || "Unknown error"}`,
              timestamp: Date.now(),
            },
          ]);
          setIsLoading(false);
          return;
        }

        pollForResponse(sessionId, currentMessageCount);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            timestamp: Date.now(),
          },
        ]);
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
    if (!selectedRepoId) return "Select a repository first...";
    if (isLoadingSession) return "Loading session...";
    if (mode === "ask") {
      return capturedContext
        ? "Ask about this component..."
        : "Ask a question about the codebase...";
    }
    return capturedContext
      ? "Describe the issue with this component..."
      : "Describe an issue to flag...";
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <RepoSelector
          repos={repos}
          selectedRepoId={selectedRepoId}
          onRepoChange={onRepoChange}
        />
        <SelectionTool />
      </div>

      {capturedContext && (
        <ContextPreview context={capturedContext} onClear={onClearContext} />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-8">
            <div className="mb-4">
              {mode === "ask" ? (
                <MessageCircle className="w-12 h-12 mx-auto opacity-50" />
              ) : (
                <Flag className="w-12 h-12 mx-auto opacity-50" />
              )}
            </div>
            <p className="mb-2">
              {mode === "ask"
                ? "Ask questions about your codebase"
                : capturedContext
                  ? "Describe the issue you want to flag"
                  : "Flag an issue for the team"}
            </p>
            <p className="text-sm">
              {mode === "ask"
                ? "Get AI-powered answers with full sandbox access"
                : "Use the select tool to capture React component context"}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-card-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center justify-center gap-3">
          <span
            className={`text-sm ${mode === "ask" ? "text-foreground font-medium" : "text-muted-foreground"}`}
          >
            Ask
          </span>
          <Switch
            checked={mode === "flag"}
            onCheckedChange={(checked) => setMode(checked ? "flag" : "ask")}
          />
          <span
            className={`text-sm ${mode === "flag" ? "text-foreground font-medium" : "text-muted-foreground"}`}
          >
            Flag Issue
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={!selectedRepoId || isLoading || isLoadingSession}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !selectedRepoId || isLoading || isLoadingSession}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
