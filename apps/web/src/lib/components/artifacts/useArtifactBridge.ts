import { useEffect } from "react";
import type { RefObject } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";

/**
 * Parent-side half of the artifact bridge. Listens for messages from the
 * sandboxed artifact iframe:
 *  - "eva-bridge-hello": the shim announcing it is ready; we reply
 *    "eva-bridge-ready" so it flushes any queued calls (race-free handshake).
 *  - "eva-mcp-call": a tool call, which we run through eva's read-only MCP tools
 *    as the signed-in user (api.artifacts.callTool) and reply to, by id.
 * Messages are accepted only from this iframe's own contentWindow (the sandboxed
 * frame is an opaque origin, so we match by source, not origin).
 */
export function useArtifactBridge(
  iframeRef: RefObject<HTMLIFrameElement | null>,
): void {
  const callTool = useAction(api.artifacts.callTool);

  useEffect(() => {
    async function handle(event: MessageEvent) {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (typeof data !== "object" || data === null || !("type" in data))
        return;

      if (data.type === "eva-bridge-hello") {
        iframe.contentWindow?.postMessage({ type: "eva-bridge-ready" }, "*");
        return;
      }
      if (data.type !== "eva-mcp-call") return;

      const id = data.id;
      const reply = (payload: Record<string, unknown>) =>
        iframe.contentWindow?.postMessage(
          { type: "eva-mcp-result", id, ...payload },
          "*",
        );
      // Serialised outside the try: React Compiler bails on the whole file when
      // a nullish-coalescing expression sits inside a try/catch.
      const argsJson = JSON.stringify(data.args ?? {});
      try {
        const result = await callTool({
          toolName: String(data.name),
          args: argsJson,
        });
        reply({ result });
      } catch (err) {
        reply({ error: err instanceof Error ? err.message : String(err) });
      }
    }

    function listener(event: MessageEvent) {
      void handle(event);
    }
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [callTool, iframeRef]);
}
