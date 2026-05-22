import {
  CALLBACK_HTTP_MAX_RETRIES,
  CALLBACK_HTTP_RETRY_BASE_MS,
  CALLBACK_HTTP_TIMEOUT_MS,
  CONVEX_SITE_URL,
  CONVEX_TOKEN,
  CONVEX_URL,
  STREAMING_HMAC,
  STREAMING_HEARTBEAT_MAX_RETRIES,
} from "../config.js";
import type { ConvexCallType, JsonObject, JsonValue } from "../types.js";

function narrowJsonValue(
  value: string | number | boolean | null | object,
): JsonValue | null {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    const items: JsonValue[] = [];
    for (const item of value) {
      const n = narrowJsonValue(item);
      if (n === null && item !== null) return null;
      items.push(n);
    }
    return items;
  }
  const obj: { [key: string]: JsonValue } = {};
  for (const [k, v] of Object.entries(value)) {
    const n = narrowJsonValue(v);
    if (n === null && v !== null) return null;
    obj[k] = n;
  }
  return obj;
}

/** Wraps fetch with an AbortController timeout. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = CALLBACK_HTTP_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Calculates exponential backoff delay with jitter for retry attempts. */
export function buildRetryDelayMs(attempt: number): number {
  const exponential = Math.pow(2, attempt - 1) * CALLBACK_HTTP_RETRY_BASE_MS;
  const jitter = Math.floor(Math.random() * 500);
  return exponential + jitter;
}

/** Calls a Convex mutation or action via HTTP API. */
export async function callConvex(
  type: ConvexCallType,
  path: string,
  args: JsonObject,
): Promise<JsonValue> {
  const endpoint = type === "mutation" ? "/api/mutation" : "/api/action";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (CONVEX_TOKEN) headers["Authorization"] = "Bearer " + CONVEX_TOKEN;
  const res = await fetchWithTimeout(CONVEX_URL + endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      "Convex " + type + " " + path + " failed: " + res.status + " " + text,
    );
  }
  const json = await res.json();
  return narrowJsonValue(json) ?? null;
}

/** Calls Convex with automatic retry on failure. */
export async function callConvexWithRetry(
  type: ConvexCallType,
  path: string,
  args: JsonObject,
  maxRetries: number = CALLBACK_HTTP_MAX_RETRIES,
): Promise<JsonValue> {
  let attempt = 0;
  while (true) {
    try {
      return await callConvex(type, path, args);
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) throw e;
      const delayMs = buildRetryDelayMs(attempt);
      console.error(
        "callConvex(" +
          type +
          ") attempt " +
          attempt +
          " failed, retrying in " +
          delayMs +
          "ms:",
        String(e),
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/** Sends one streaming heartbeat request through the scoped HMAC endpoint or legacy mutation fallback. */
export async function callStreamingHeartbeatOnce(
  entityId: string,
  currentActivity: string,
  currentContent: string,
  pendingQuestion?: string,
): Promise<string | JsonValue> {
  if (CONVEX_SITE_URL && STREAMING_HMAC) {
    const body = new URLSearchParams();
    body.set("entityId", entityId);
    body.set("hmac", STREAMING_HMAC);
    body.set("currentActivity", currentActivity);
    body.set("currentContent", currentContent || "");
    if (pendingQuestion) {
      body.set("pendingQuestion", pendingQuestion);
    }
    const res = await fetchWithTimeout(
      CONVEX_SITE_URL + "/api/streaming/heartbeat",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error("Streaming heartbeat failed: " + res.status + " " + text);
    }
    return res.text();
  }

  const args: JsonObject = {
    entityId,
    currentActivity,
    currentContent,
  };
  if (pendingQuestion) {
    args.pendingQuestion = pendingQuestion;
  }
  return await callConvex("mutation", "streaming:set", args);
}

/** Sends a streaming heartbeat update with current activity and content. */
export async function callStreamingHeartbeat(
  entityId: string,
  currentActivity: string,
  currentContent: string,
  pendingQuestion?: string,
): Promise<string | JsonValue> {
  let attempt = 0;
  while (true) {
    try {
      return await callStreamingHeartbeatOnce(
        entityId,
        currentActivity,
        currentContent,
        pendingQuestion,
      );
    } catch (e) {
      attempt++;
      if (attempt > STREAMING_HEARTBEAT_MAX_RETRIES) throw e;
      const delayMs = buildRetryDelayMs(attempt);
      console.error(
        "streaming heartbeat attempt " +
          attempt +
          " failed, retrying in " +
          delayMs +
          "ms:",
        String(e),
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
