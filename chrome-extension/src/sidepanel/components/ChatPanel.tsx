import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { RepoSelector } from "./RepoSelector";
import { SelectionTool } from "./SelectionTool";
import { ContextPreview } from "./ContextPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { IconSend, IconFlag, IconMessageCircle } from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";
import { GenericId as Id } from "convex/values";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

type Mode = "ask" | "flag";

interface ChatPanelProps {
  repos: Array<{
    _id: Id<"githubRepos">;
    owner: string;
    name: string;
  }>;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);

  const session = useQuery(
    api.sessions.list,
    selectedRepoId ? { repoId: selectedRepoId as Id<"githubRepos"> } : "skip",
  );

  const activeSession = session?.[0];
  const isLoadingSession = session === undefined && selectedRepoId !== null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeSession && mode === "ask") {
      setMessages(
        activeSession.messages.map((m, i) => ({
          id: `session-${i}`,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      );
    }
  }, [activeSession, mode]);

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

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Issue flagged successfully!${capturedContext ? `\n\nI've attached the captured ${capturedContext.metadata.hasReact ? "React component" : "element"} context to the task.` : ""}`,
            timestamp: Date.now(),
          },
        ]);
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
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Ask mode requires the session API. This feature is coming soon.",
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);
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
                <IconMessageCircle size={48} className="mx-auto opacity-50" />
              ) : (
                <IconFlag size={48} className="mx-auto opacity-50" />
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
                : "Use the select tool to capture element context"}
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
            disabled={
              !input.trim() || !selectedRepoId || isLoading || isLoadingSession
            }
            size="icon"
          >
            <IconSend size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
