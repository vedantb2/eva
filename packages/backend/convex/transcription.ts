"use node";

import { gateway } from "@ai-sdk/gateway";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

/**
 * Hardcoded streaming STT model. Swap here based on feedback — not a user
 * setting. $0.20/hr streaming via AI Gateway.
 */
const TRANSCRIPTION_MODEL = "xai/grok-stt";

/**
 * Mints a short-lived, model-scoped client token so the browser can open a
 * streaming transcription WebSocket without ever holding `AI_GATEWAY_API_KEY`.
 * Requires the caller to have voice dictation enabled.
 */
export const mintTranscriptionToken = action({
  args: {},
  returns: v.object({
    token: v.string(),
    url: v.string(),
    modelId: v.string(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(internal.auth.getUserByClerkId, {
      clerkId: identity.subject,
    });
    if (!user) {
      throw new Error("User not found");
    }
    if (user.voiceDictationEnabled !== true) {
      throw new Error("Voice dictation is not enabled");
    }

    try {
      const { token, url } = await gateway.experimental_transcription.getToken({
        model: TRANSCRIPTION_MODEL,
      });
      return { token, url, modelId: TRANSCRIPTION_MODEL };
    } catch (error) {
      console.error("[transcription.mintTranscriptionToken]", error);
      throw new Error(
        "Could not start voice dictation. Try again in a moment.",
        { cause: error },
      );
    }
  },
});
