import { PROVIDER } from "../config.js";
import { buildStreamingPayload } from "../runtime/heartbeats.js";
import { getProviderAdapter } from "../providers/index.js";
import { callbackState as S } from "../runtime/state.js";
import { tryParseJson } from "../utils.js";
import { sendStreamingHeartbeatUpdate } from "../runtime/heartbeats.js";

/** Buffers stdout chunks and processes complete lines for realtime event handling. */
export function processRealtimeStdoutChunk(text: string): void {
  S.realtimeOutputBuffer += text;
  while (true) {
    const newlineIndex = S.realtimeOutputBuffer.indexOf("\n");
    if (newlineIndex === -1) {
      return;
    }
    const line = S.realtimeOutputBuffer.slice(0, newlineIndex).trim();
    S.realtimeOutputBuffer = S.realtimeOutputBuffer.slice(newlineIndex + 1);
    if (!line) {
      continue;
    }
    handleRealtimeStreamLine(line);
  }
}

function handleRealtimeStreamLine(line: string): void {
  const parsed = tryParseJson(line);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return;
  }
  const result = getProviderAdapter(PROVIDER).onStreamLine(line, parsed);
  if (result.needsHeartbeat) {
    void sendStreamingHeartbeatUpdate(buildStreamingPayload());
  }
}
