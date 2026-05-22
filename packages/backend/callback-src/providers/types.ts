import type { CanonicalEvent, JsonObject, StreamLineResult } from "../types.js";

export type ProviderAdapter = {
  parseLine: (event: JsonObject) => CanonicalEvent[];
  onStreamLine: (line: string, parsed: JsonObject) => StreamLineResult;
  onStdoutText?: (text: string) => void;
};
