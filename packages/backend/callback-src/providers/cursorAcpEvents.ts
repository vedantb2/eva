import type {
  ContentBlock,
  PlanEntry,
  SessionNotification,
  ToolCall,
  ToolCallContent,
  ToolCallUpdate,
} from "@agentclientprotocol/sdk";
import type {
  CanonicalEvent,
  ProgressStep,
  TodoItem,
  ToolCompleteResult,
} from "../types.js";

const TOOL_LABELS: Record<string, string> = {
  read: "Reading file...",
  edit: "Editing file...",
  delete: "Editing file...",
  move: "Editing file...",
  search: "Searching code...",
  execute: "Running command...",
  think: "Thinking...",
  fetch: "Fetching URL...",
  switch_mode: "Switching mode...",
  other: "Using tool...",
};

function toolStepType(kind: ToolCall["kind"]): string {
  if (kind === "execute") return "bash";
  if (kind === "fetch") return "web_fetch";
  if (kind === "think") return "thinking";
  if (kind === "other" || kind === undefined) return "tool";
  return kind;
}

function toolLabel(kind: ToolCall["kind"], title: string): string {
  if (kind !== undefined) return TOOL_LABELS[kind] ?? title;
  return title || "Using tool...";
}

function firstLocationPath(
  locations: ToolCall["locations"] | ToolCallUpdate["locations"],
): string | undefined {
  const first = locations?.[0];
  return first?.path;
}

function contentText(content: ToolCallContent[]): string {
  const parts: string[] = [];
  for (const item of content) {
    if (item.type === "content" && item.content.type === "text") {
      parts.push(item.content.text);
    } else if (item.type === "diff") {
      parts.push(`Updated ${item.path}`);
    }
  }
  return parts.join("\n").trim();
}

function changedFiles(content: ToolCallContent[]): string[] {
  return content.flatMap((item) => (item.type === "diff" ? [item.path] : []));
}

function toolResult(update: ToolCallUpdate): ToolCompleteResult | undefined {
  const content = update.content ?? [];
  const text = contentText(content);
  const files = changedFiles(content);
  const rawText =
    typeof update.rawOutput === "string" ? update.rawOutput.trim() : "";
  const outputText = text || rawText;
  if (!outputText && files.length === 0 && update.status !== "failed") {
    return undefined;
  }
  return {
    ...(outputText ? { output: { text: outputText } } : {}),
    ...(files.length > 0 ? { files } : {}),
    ...(update.status === "failed" ? { isError: true } : {}),
  };
}

function todoFromPlanEntry(entry: PlanEntry): TodoItem {
  return { content: entry.content, status: entry.status };
}

function textFromContent(content: ContentBlock): string {
  if (content.type === "text") return content.text;
  if (content.type === "resource" && "text" in content.resource) {
    return content.resource.text;
  }
  return "";
}

/**
 * Stateful ACP update adapter. It rejects replay/foreign-session updates and
 * assembles only the active prompt generation into Eva's canonical events.
 */
export class CursorAcpEventAdapter {
  private activeSessionId = "";
  private replaying = false;
  private turnActive = false;
  private generation = 0;
  private activeGeneration = 0;
  private lastMessageId = "";
  private messageStarted = false;
  private finalText = "";
  private readonly terminalToolIds = new Set<string>();
  private readonly emittedEvents: CanonicalEvent[] = [];
  private replayNotificationCount = 0;

  setSession(sessionId: string): void {
    this.activeSessionId = sessionId;
  }

  beginReplay(): void {
    this.replaying = true;
    this.replayNotificationCount = 0;
  }

  endReplay(): void {
    this.replaying = false;
  }

  getReplayNotificationCount(): number {
    return this.replayNotificationCount;
  }

  beginTurn(): number {
    this.generation += 1;
    this.activeGeneration = this.generation;
    this.turnActive = true;
    this.lastMessageId = "";
    this.messageStarted = false;
    this.finalText = "";
    this.terminalToolIds.clear();
    this.emittedEvents.length = 0;
    return this.activeGeneration;
  }

  endTurn(generation: number): void {
    if (generation === this.activeGeneration) this.turnActive = false;
  }

  getFinalText(): string {
    return this.finalText;
  }

  getEvents(): CanonicalEvent[] {
    return [...this.emittedEvents];
  }

  record(events: CanonicalEvent[]): void {
    this.emittedEvents.push(...events);
  }

  handle(notification: SessionNotification): CanonicalEvent[] {
    if (notification.sessionId !== this.activeSessionId) return [];
    if (this.replaying) {
      this.replayNotificationCount += 1;
      return [];
    }
    if (!this.turnActive) return [];

    const events = this.mapUpdate(notification.update);
    this.emittedEvents.push(...events);
    return events;
  }

  private mapAgentMessage(
    messageId: string | null | undefined,
    content: ContentBlock,
  ): CanonicalEvent[] {
    const text = textFromContent(content);
    if (!text) return [];

    const events: CanonicalEvent[] = [];
    const isNewMessage =
      !this.messageStarted ||
      (typeof messageId === "string" &&
        messageId.length > 0 &&
        messageId !== this.lastMessageId);
    if (isNewMessage) {
      events.push({ kind: "mark_message_start" });
      if (this.finalText && !this.finalText.endsWith("\n")) {
        this.finalText += "\n\n";
      }
      this.messageStarted = true;
      if (typeof messageId === "string") this.lastMessageId = messageId;
    }
    this.finalText += text;
    events.push({ kind: "stream_text_delta", text });
    return events;
  }

  private mapToolCall(tool: ToolCall): CanonicalEvent[] {
    if (this.terminalToolIds.has(tool.toolCallId)) return [];
    const step: ProgressStep = {
      type: toolStepType(tool.kind),
      label: toolLabel(tool.kind, tool.title),
      detail: tool.title,
      status: tool.status === "completed" ? "complete" : "active",
      toolUseId: tool.toolCallId,
      ...(firstLocationPath(tool.locations)
        ? { path: firstLocationPath(tool.locations) }
        : {}),
    };
    const events: CanonicalEvent[] = [
      {
        kind: "push_step",
        trackingId: tool.toolCallId,
        step,
      },
    ];
    if (tool.status === "completed" || tool.status === "failed") {
      this.terminalToolIds.add(tool.toolCallId);
      events.push({
        kind: "complete_tool",
        trackingId: tool.toolCallId,
        result: toolResult(tool),
      });
    }
    return events;
  }

  private mapToolUpdate(update: ToolCallUpdate): CanonicalEvent[] {
    if (this.terminalToolIds.has(update.toolCallId)) return [];
    if (update.status !== "completed" && update.status !== "failed") return [];
    this.terminalToolIds.add(update.toolCallId);
    return [
      {
        kind: "complete_tool",
        trackingId: update.toolCallId,
        result: toolResult(update),
      },
    ];
  }

  private mapUpdate(update: SessionNotification["update"]): CanonicalEvent[] {
    switch (update.sessionUpdate) {
      case "agent_message_chunk":
        return this.mapAgentMessage(update.messageId, update.content);
      case "agent_thought_chunk": {
        const text = textFromContent(update.content);
        return text ? [{ kind: "update_reasoning", text }] : [];
      }
      case "user_message_chunk":
        return [];
      case "tool_call":
        return this.mapToolCall(update);
      case "tool_call_update":
        return this.mapToolUpdate(update);
      case "plan":
        return [
          { kind: "set_todos", todos: update.entries.map(todoFromPlanEntry) },
        ];
      case "plan_update":
        return update.plan.type === "items"
          ? [
              {
                kind: "set_todos",
                todos: update.plan.entries.map(todoFromPlanEntry),
              },
            ]
          : [];
      default:
        return [];
    }
  }
}
