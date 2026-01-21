import { useState, useRef, useEffect } from "react";
import { RepoSelector } from "./RepoSelector";
import { SelectionTool } from "./SelectionTool";
import { ContextPreview } from "./ContextPreview";
import type { ExtractedContext, RepoInfo } from "@/shared/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        assistantContent = `Task created successfully!${capturedContext ? "\n\nI've attached the captured React component context to the task." : ""}`;
        onClearContext();
      } else {
        assistantContent = `Failed to create task: ${response.error || "Unknown error"}`;
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantContent,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
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
          <div className="text-center text-slate-500 mt-8">
            <p className="mb-2">
              {capturedContext
                ? "Describe the change you want to make"
                : "Select an element or describe a task"}
            </p>
            <p className="text-sm">
              {capturedContext
                ? "The captured context will be attached to your task"
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
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-100"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !selectedRepoId
                ? "Select a repository first..."
                : capturedContext
                  ? "Describe the change you want..."
                  : "Describe your task..."
            }
            disabled={!selectedRepoId || isLoading}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedRepoId || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
