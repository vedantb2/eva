import { useState, useRef, useEffect } from "react";
import { useUser, useAuth } from "@clerk/chrome-extension";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { ContextPreview } from "./ContextPreview";
import { SelectionTool } from "./SelectionTool";
import { Button } from "@/components/ui/button";
import { IconArrowUp, IconFlag, IconMessageCircle } from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";
import { GenericId as Id } from "convex/values";

const API_URL = import.meta.env.VITE_API_URL;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  mode?: Mode;
}

type Mode = "ask" | "flag";

interface ChatPanelProps {
  selectedRepoId: string | null;
  sessionId: string | null;
  capturedContext: ExtractedContext | null;
  onClearContext: () => void;
}

export function ChatPanel({
  selectedRepoId,
  sessionId,
  capturedContext,
  onClearContext,
}: ChatPanelProps) {
  useUser();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("ask");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const addMessage = useMutation(api.sessions.addMessage);

  const currentSession = useQuery(
    api.sessions.get,
    sessionId ? { id: sessionId as Id<"sessions"> } : "skip",
  );

  const isLoadingSession = sessionId !== null && currentSession === undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (currentSession) {
      setMessages(
        currentSession.messages.map((m, i) => ({
          id: `session-${i}`,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          mode: m.mode === "ask" || m.mode === "flag" ? m.mode : undefined,
        })),
      );
    }
  }, [currentSession]);

  const handleSend = async () => {
    if (!input.trim() || !selectedRepoId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
      mode: mode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (mode === "flag") {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const pageUrl = tab?.url || "";

        let fullDescription = input;

        if (pageUrl) {
          fullDescription += `\n\n**This issue must be resolved on the following page:** ${pageUrl} 
          
Please review all components and files used on this page before implementing the fix.`;
        }

        if (capturedContext) {
          fullDescription += `\n\n---\n**Captured Element Context**\n`;
          fullDescription += `- Element: \`<${capturedContext.element.tagName}>\`\n`;
          fullDescription += `- Selector: \`${capturedContext.element.selector}\`\n`;
          if (capturedContext.element.id) {
            fullDescription += `- ID: \`${capturedContext.element.id}\`\n`;
          }
          if (capturedContext.element.classNames.length > 0) {
            fullDescription += `- Classes: \`${capturedContext.element.classNames.join(", ")}\`\n`;
          }

          if (capturedContext.metadata.hasReact && capturedContext.react) {
            fullDescription += `\n**React Context**\n`;
            fullDescription += `- Component: \`${capturedContext.react.name || "Unknown"}\`\n`;
            fullDescription += `- Total components: ${capturedContext.metadata.totalComponents}\n`;
            fullDescription += `- React version: ${capturedContext.metadata.reactVersion}\n\n`;
            fullDescription += `<details>\n<summary>Full Component Tree</summary>\n\n\`\`\`json\n${JSON.stringify(capturedContext.react, null, 2)}\n\`\`\`\n</details>`;
          } else {
            fullDescription += `\n<details>\n<summary>Element Details</summary>\n\n\`\`\`json\n${JSON.stringify(capturedContext.element, null, 2)}\n\`\`\`\n</details>`;
          }
        }

        await createQuickTask({
          repoId: selectedRepoId as Id<"githubRepos">,
          title: input.slice(0, 100),
          description: fullDescription,
        });

        const successMessage = `Issue flagged successfully!${capturedContext ? `\n\nI've attached the captured ${capturedContext.metadata.hasReact ? "React component" : "element"} context to the task.` : ""}`;

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: successMessage,
            timestamp: Date.now(),
          },
        ]);

        if (sessionId) {
          await addMessage({
            id: sessionId as Id<"sessions">,
            role: "user",
            content: input,
            mode: "flag",
          });
          await addMessage({
            id: sessionId as Id<"sessions">,
            role: "assistant",
            content: successMessage,
          });
        }

        onClearContext();
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
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const pageUrl = tab?.url || "";
        const fullMessage = pageUrl
          ? `The user's question comes from this URL. Look into the code in this route and answer based on the code in that folder. URL: ${pageUrl}\n\n${input}`
          : input;

        const token = await getToken({ template: "convex" });
        const response = await fetch(`${API_URL}/api/extension/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: sessionId,
            message: input,
            contextMessage: fullMessage,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send message");
        }
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
        ? "Ask about this element..."
        : "Ask a question about the codebase...";
    }
    return capturedContext
      ? "Describe the issue with this element..."
      : "Describe an issue to flag...";
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className={`flex-1 p-4 space-y-4 ${messages.length > 0 ? "overflow-y-auto" : "overflow-hidden"}`}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="mb-3 rounded-full bg-muted p-4">
              {mode === "ask" ? (
                <IconMessageCircle size={28} className="text-teal-500" />
              ) : (
                <IconFlag size={28} className="text-teal-500" />
              )}
            </div>
            <p className="font-medium text-foreground text-sm mb-1">
              {mode === "ask"
                ? "Ask questions about your codebase"
                : capturedContext
                  ? "Describe the issue you want to flag"
                  : "Flag an issue for the team"}
            </p>
            <p className="text-xs max-w-[200px]">
              {mode === "ask"
                ? "Get AI-powered answers with full sandbox access"
                : "Use the select tool to capture element context"}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 overflow-hidden ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-card-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-sm">
                {message.content}
              </p>
            </div>
            {message.role === "user" && message.mode && (
              <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {message.mode === "ask" ? (
                  <IconMessageCircle size={12} />
                ) : (
                  <IconFlag size={12} />
                )}
                {message.mode === "ask" ? "Ask" : "Flag"}
              </span>
            )}
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
        {capturedContext && (
          <ContextPreview context={capturedContext} onClear={onClearContext} />
        )}

        <div className="flex items-center gap-3">
          <SelectionTool hasCapturedContext={capturedContext !== null} />
          <div className="flex-1 flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setMode("ask")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === "ask"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconMessageCircle size={16} />
              Ask
            </button>
            <button
              onClick={() => setMode("flag")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === "flag"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconFlag size={16} />
              Flag Issue
            </button>
          </div>
        </div>

        <div className="flex gap-2 items-end bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={!selectedRepoId || isLoading || isLoadingSession}
            rows={3}
            className="flex-1 min-h-[4.5rem] resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={
              !input.trim() || !selectedRepoId || isLoading || isLoadingSession
            }
            size="icon"
            className="mb-auto mr-2 mt-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <IconArrowUp size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
