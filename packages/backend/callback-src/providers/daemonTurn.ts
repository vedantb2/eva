import { writeFileSync } from "node:fs";
import { fetchWithTimeout } from "../http/convexClient.js";
import type { JsonValue } from "../types.js";
import { log } from "../utils.js";

export type ClaimedTurn = {
  prompt: string;
  attachmentUrls: string[];
};

function readClaimPayload(result: JsonValue): Record<string, JsonValue> | null {
  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    return null;
  }
  const inner = result.value;
  return typeof inner === "object" && inner !== null && !Array.isArray(inner)
    ? inner
    : result;
}

/** Reads one atomically claimed chat turn from Convex's HTTP envelope. */
export function readClaimedTurn(result: JsonValue): ClaimedTurn | null {
  const payload = readClaimPayload(result);
  if (payload === null || typeof payload.prompt !== "string") {
    return null;
  }
  const attachmentUrls = Array.isArray(payload.attachmentUrls)
    ? payload.attachmentUrls.filter(
        (url): url is string => typeof url === "string",
      )
    : [];
  return { prompt: payload.prompt, attachmentUrls };
}

/** Mirrors attachmentExtensionForMimeType in Convex's sandbox runtime. */
function attachmentExtensionForMimeType(mimeType: string): string {
  const type = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  switch (type) {
    case "image/jpeg":
      return ".jpg";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    case "image/png":
      return ".png";
    case "text/html":
      return ".html";
    case "text/markdown":
      return ".md";
    case "text/plain":
      return ".txt";
    default:
      return type.startsWith("image/") ? ".png" : ".bin";
  }
}

/** Downloads a claimed turn's attachments before its provider sees the prompt. */
export async function materializeTurnAttachments(
  turn: ClaimedTurn,
): Promise<void> {
  if (turn.attachmentUrls.length === 0) return;
  const paths: string[] = [];
  for (let index = 0; index < turn.attachmentUrls.length; index++) {
    const url = turn.attachmentUrls[index];
    if (!url) continue;
    try {
      const response = await fetchWithTimeout(url, { method: "GET" });
      if (!response.ok) {
        log(`daemon: attachment download failed status=${response.status}`);
        continue;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      const extension = attachmentExtensionForMimeType(
        response.headers.get("content-type") ?? "",
      );
      const path = `/tmp/eva-attachment-${index}${extension}`;
      writeFileSync(path, bytes);
      paths.push(path);
    } catch (error) {
      log(
        `daemon: attachment download error ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  if (paths.length === 0) return;
  const list = paths.map((path) => `- ${path}`).join("\n");
  turn.prompt += `\n\n---\nThe user attached the following file(s). Read them with your file-reading tool before responding:\n${list}`;
}
