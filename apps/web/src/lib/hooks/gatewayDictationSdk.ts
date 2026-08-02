/**
 * Thin re-export so `useGatewayDictation` can dynamically import a
 * statically-analyzable path (keeps the STT SDK out of the main composer chunk).
 */
export { experimental_streamTranscribe } from "ai";
export { createGateway } from "@ai-sdk/gateway";
