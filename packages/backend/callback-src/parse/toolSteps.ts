import type { JsonObject, ProgressStep } from "../types.js";
import { shortenPath } from "../utils.js";

/** Converts an opencode tool call event part into a UI progress step object. */
export function opencodeToolToStep(part: JsonObject): ProgressStep {
  const tool = typeof part.tool === "string" ? part.tool : "tool";
  const stateObj =
    part.state && typeof part.state === "object" && !Array.isArray(part.state)
      ? part.state
      : null;
  const input =
    stateObj &&
    "input" in stateObj &&
    stateObj.input &&
    typeof stateObj.input === "object" &&
    !Array.isArray(stateObj.input)
      ? stateObj.input
      : {};
  const path =
    typeof input.filePath === "string"
      ? shortenPath(input.filePath)
      : typeof input.file_path === "string"
        ? shortenPath(input.file_path)
        : typeof input.path === "string"
          ? shortenPath(input.path)
          : "";
  switch (tool) {
    case "read":
      return {
        type: "read",
        label: "Reading file...",
        detail: path || undefined,
        status: "active",
      };
    case "glob":
      return {
        type: "search_files",
        label: "Searching files...",
        detail: typeof input.pattern === "string" ? input.pattern : undefined,
        status: "active",
      };
    case "grep":
      return {
        type: "search_code",
        label: "Searching code...",
        detail: typeof input.pattern === "string" ? input.pattern : undefined,
        status: "active",
      };
    case "write":
      return {
        type: "write",
        label: "Creating file...",
        detail: path || undefined,
        status: "active",
      };
    case "edit":
      return {
        type: "edit",
        label: "Editing file...",
        detail: path || undefined,
        status: "active",
      };
    case "bash":
      return {
        type: "bash",
        label: "Running command...",
        detail:
          typeof input.command === "string"
            ? input.command.slice(0, 300)
            : undefined,
        status: "active",
      };
    case "webfetch":
      return {
        type: "web_fetch",
        label: "Fetching URL...",
        detail: typeof input.url === "string" ? input.url : undefined,
        status: "active",
      };
    case "websearch":
      return {
        type: "web_search",
        label: "Searching web...",
        detail: typeof input.query === "string" ? input.query : undefined,
        status: "active",
      };
    case "task":
      return {
        type: "subtask",
        label: "Running agent...",
        detail:
          typeof input.description === "string" ? input.description : undefined,
        status: "active",
      };
    case "todowrite":
    case "todoread":
      return { type: "tool", label: "Updating tasks...", status: "active" };
    default:
      return {
        type: "tool",
        label: "Using " + tool + "...",
        status: "active",
      };
  }
}

function resolveCursorToolCall(toolCall: JsonObject): {
  kind: string;
  args: JsonObject;
  displayName: string;
} {
  for (const key of Object.keys(toolCall)) {
    if (!key.endsWith("ToolCall")) continue;
    const payload = toolCall[key];
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      continue;
    const args =
      "args" in payload &&
      payload.args &&
      typeof payload.args === "object" &&
      !Array.isArray(payload.args)
        ? payload.args
        : "input" in payload &&
            payload.input &&
            typeof payload.input === "object" &&
            !Array.isArray(payload.input)
          ? payload.input
          : "parameters" in payload &&
              payload.parameters &&
              typeof payload.parameters === "object" &&
              !Array.isArray(payload.parameters)
            ? payload.parameters
            : payload;
    return {
      kind: key.slice(0, -"ToolCall".length).toLowerCase(),
      args,
      displayName: key,
    };
  }
  const flatName =
    typeof toolCall.name === "string"
      ? toolCall.name
      : typeof toolCall.tool === "string"
        ? toolCall.tool
        : typeof toolCall.type === "string"
          ? toolCall.type
          : "";
  const flatArgs =
    toolCall.args &&
    typeof toolCall.args === "object" &&
    !Array.isArray(toolCall.args)
      ? toolCall.args
      : toolCall.input &&
          typeof toolCall.input === "object" &&
          !Array.isArray(toolCall.input)
        ? toolCall.input
        : toolCall.parameters &&
            typeof toolCall.parameters === "object" &&
            !Array.isArray(toolCall.parameters)
          ? toolCall.parameters
          : {};
  return {
    kind: flatName.toLowerCase(),
    args: flatArgs,
    displayName: flatName,
  };
}

/** Converts a Cursor tool_call event payload into a UI progress step object. */
export function cursorToolToStep(toolCall: JsonObject): ProgressStep {
  const { kind, args, displayName } = resolveCursorToolCall(toolCall);
  const pickString = (keys: string[]): string => {
    for (const key of keys) {
      if (typeof args[key] === "string" && args[key].trim()) {
        return args[key];
      }
    }
    return "";
  };
  const rawPath = pickString([
    "path",
    "file_path",
    "filePath",
    "target_file",
    "targetFile",
    "relativePath",
    "relative_path",
  ]);
  const path = rawPath ? shortenPath(String(rawPath)) : "";
  const command = pickString(["command", "cmd"]);
  const query = pickString([
    "query",
    "pattern",
    "url",
    "glob_pattern",
    "globPattern",
  ]);
  const tool = kind || displayName.toLowerCase();
  if (tool.includes("read")) {
    return {
      type: "read",
      label: "Reading file...",
      detail: path || undefined,
      status: "active",
    };
  }
  if (tool.includes("write") || tool.includes("create")) {
    return {
      type: "write",
      label: "Creating file...",
      detail: path || undefined,
      status: "active",
    };
  }
  if (
    tool.includes("edit") ||
    tool.includes("patch") ||
    tool.includes("apply") ||
    tool.includes("replace") ||
    tool.includes("strreplace")
  ) {
    return {
      type: "edit",
      label: "Editing file...",
      detail: path || undefined,
      status: "active",
    };
  }
  if (tool.includes("delete") || tool.includes("remove")) {
    return {
      type: "edit",
      label: "Deleting file...",
      detail: path || undefined,
      status: "active",
    };
  }
  if (tool.includes("glob") || tool.includes("list") || tool === "ls") {
    return {
      type: "search_files",
      label: "Searching files...",
      detail: query || path || undefined,
      status: "active",
    };
  }
  if (tool.includes("grep") || tool.includes("search")) {
    return {
      type: tool.includes("file") ? "search_files" : "search_code",
      label: tool.includes("file") ? "Searching files..." : "Searching code...",
      detail: query || path || undefined,
      status: "active",
    };
  }
  if (
    tool.includes("bash") ||
    tool.includes("shell") ||
    tool.includes("exec") ||
    tool.includes("command") ||
    tool.includes("terminal")
  ) {
    return {
      type: "bash",
      label: "Running command...",
      detail: command ? command.slice(0, 300) : undefined,
      status: "active",
    };
  }
  if (
    tool.includes("webfetch") ||
    tool.includes("web_fetch") ||
    (tool.includes("fetch") && !tool.includes("search"))
  ) {
    return {
      type: "web_fetch",
      label: "Fetching URL...",
      detail: query || undefined,
      status: "active",
    };
  }
  if (tool.includes("websearch") || tool.includes("web_search")) {
    return {
      type: "web_search",
      label: "Searching web...",
      detail: query || undefined,
      status: "active",
    };
  }
  if (tool.includes("todo")) {
    return { type: "tool", label: "Updating tasks...", status: "active" };
  }
  if (tool.includes("mcp")) {
    const server = pickString([
      "server",
      "serverName",
      "server_name",
      "toolName",
      "tool_name",
    ]);
    return {
      type: "tool",
      label: server ? "Using MCP " + server + "..." : "Using MCP tool...",
      status: "active",
    };
  }
  const fallbackName = displayName || kind || "tool";
  return {
    type: "tool",
    label: "Using " + fallbackName + "...",
    status: "active",
  };
}

/** Converts a Claude tool call into a UI progress step object. */
export function toolCallToStep(name: string, input: JsonObject): ProgressStep {
  const path =
    typeof input.file_path === "string"
      ? shortenPath(String(input.file_path))
      : "";
  switch (name) {
    case "Read":
      return {
        type: "read",
        label: "Reading file...",
        detail: path || undefined,
        status: "active",
      };
    case "Glob":
      return {
        type: "search_files",
        label: "Searching files...",
        detail:
          typeof input.pattern === "string" ? String(input.pattern) : undefined,
        status: "active",
      };
    case "Grep":
      return {
        type: "search_code",
        label: "Searching code...",
        detail:
          typeof input.pattern === "string" ? String(input.pattern) : undefined,
        status: "active",
      };
    case "Write":
      return {
        type: "write",
        label: "Creating file...",
        detail: path || undefined,
        status: "active",
      };
    case "Edit":
      return {
        type: "edit",
        label: "Editing file...",
        detail: path || undefined,
        status: "active",
      };
    case "Bash":
    case "bash":
      return {
        type: "bash",
        label: "Running command...",
        detail:
          typeof input.command === "string"
            ? String(input.command).slice(0, 300)
            : undefined,
        status: "active",
      };
    case "Skill":
      return {
        type: "tool",
        label: "Using Skill...",
        detail:
          typeof input.skill === "string" ? String(input.skill) : undefined,
        status: "active",
      };
    case "WebFetch":
      return {
        type: "web_fetch",
        label: "Fetching URL...",
        detail: typeof input.url === "string" ? String(input.url) : undefined,
        status: "active",
      };
    case "WebSearch":
      return {
        type: "web_search",
        label: "Searching web...",
        detail:
          typeof input.query === "string" ? String(input.query) : undefined,
        status: "active",
      };
    case "NotebookEdit":
      return {
        type: "notebook",
        label: "Editing notebook...",
        detail:
          typeof input.notebook_path === "string"
            ? shortenPath(String(input.notebook_path))
            : undefined,
        status: "active",
      };
    case "Agent":
      return {
        type: "subtask",
        label: "Running agent...",
        detail:
          typeof input.description === "string"
            ? String(input.description)
            : undefined,
        status: "active",
      };
    case "TodoWrite":
      return { type: "tool", label: "Updating tasks...", status: "active" };
    case "TodoRead":
      return { type: "tool", label: "Reading tasks...", status: "active" };
    case "AskUserQuestion":
      return {
        type: "question",
        label: "Asking a question...",
        status: "active",
      };
    default:
      return {
        type: "tool",
        label: "Using " + name + "...",
        status: "active",
      };
  }
}

export function getCodexFieldValue(item: JsonObject, keys: string[]): string {
  const sources: JsonObject[] = [item];
  if (
    item.input &&
    typeof item.input === "object" &&
    !Array.isArray(item.input)
  ) {
    sources.push(item.input);
  }
  for (const source of sources) {
    for (const key of keys) {
      if (typeof source[key] === "string" && source[key].trim()) {
        return source[key].trim();
      }
    }
  }
  return "";
}

export function getCodexThreadId(event: JsonObject): string {
  if (typeof event.thread_id === "string" && event.thread_id.trim()) {
    return event.thread_id.trim();
  }
  if (
    event.thread &&
    typeof event.thread === "object" &&
    !Array.isArray(event.thread) &&
    typeof event.thread.id === "string" &&
    event.thread.id.trim()
  ) {
    return event.thread.id.trim();
  }
  return "";
}

export function getCodexAgentMessageText(item: JsonObject): string {
  if (item.type !== "agent_message") {
    return "";
  }
  if (typeof item.text === "string" && item.text) {
    return item.text;
  }
  if (!Array.isArray(item.content)) {
    return "";
  }
  const parts: string[] = [];
  for (const block of item.content) {
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    if (typeof block.text === "string" && block.text) {
      parts.push(block.text);
      continue;
    }
    if (typeof block.content === "string" && block.content) {
      parts.push(block.content);
    }
  }
  return parts.join("");
}

export function codexItemToStep(item: JsonObject): ProgressStep {
  const itemType =
    item && typeof item.type === "string" && item.type.trim()
      ? item.type.trim()
      : "tool";
  const normalizedType = itemType.toLowerCase();
  const pathValue = getCodexFieldValue(item, [
    "file_path",
    "path",
    "target_file",
    "target_path",
    "notebook_path",
  ]);
  const queryValue = getCodexFieldValue(item, ["query", "pattern", "url"]);
  const commandValue = getCodexFieldValue(item, ["command", "cmd"]);
  const descriptionValue = getCodexFieldValue(item, [
    "description",
    "name",
    "tool",
    "skill",
  ]);
  const normalizedDescription = descriptionValue.toLowerCase();
  const pathDetail = pathValue ? shortenPath(String(pathValue)) : "";

  if (normalizedType === "mcp_tool_call") {
    if (normalizedDescription.includes("fetch_file")) {
      return {
        type: "read",
        label: "Reading file...",
        detail: descriptionValue || undefined,
        status: "active",
      };
    }
    if (
      normalizedDescription.includes("search") ||
      normalizedDescription.includes("list_repositories") ||
      normalizedDescription.includes("list_mcp_resources")
    ) {
      return {
        type: "search_code",
        label: "Searching code...",
        detail: descriptionValue || undefined,
        status: "active",
      };
    }
    return {
      type: "tool",
      label: "Using MCP...",
      detail: descriptionValue || undefined,
      status: "active",
    };
  }

  if (normalizedType.includes("web")) {
    return {
      type: normalizedType.includes("search") ? "web_search" : "web_fetch",
      label: normalizedType.includes("search")
        ? "Searching web..."
        : "Fetching URL...",
      detail: queryValue || pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("read")) {
    return {
      type: "read",
      label: "Reading file...",
      detail: pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("grep") || normalizedType.includes("search")) {
    return {
      type: normalizedType.includes("file") ? "search_files" : "search_code",
      label: normalizedType.includes("file")
        ? "Searching files..."
        : "Searching code...",
      detail: queryValue || pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("glob") || normalizedType.includes("list")) {
    return {
      type: "search_files",
      label: "Searching files...",
      detail: queryValue || pathDetail || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("write") || normalizedType.includes("create")) {
    return {
      type: "write",
      label: "Creating file...",
      detail: pathDetail || undefined,
      status: "active",
    };
  }
  if (
    normalizedType.includes("edit") ||
    normalizedType.includes("patch") ||
    normalizedType.includes("apply")
  ) {
    return {
      type: "edit",
      label: "Editing file...",
      detail: pathDetail || undefined,
      status: "active",
    };
  }
  if (
    normalizedType.includes("command") ||
    normalizedType.includes("shell") ||
    normalizedType.includes("bash") ||
    normalizedType.includes("exec")
  ) {
    return {
      type: "bash",
      label: "Running command...",
      detail: commandValue || descriptionValue || undefined,
      status: "active",
    };
  }
  if (normalizedType.includes("agent")) {
    return {
      type: "subtask",
      label: "Running agent...",
      detail: descriptionValue || undefined,
      status: "active",
    };
  }
  return {
    type: "tool",
    label: "Using " + itemType + "...",
    detail: descriptionValue || pathDetail || queryValue || undefined,
    status: "active",
  };
}
