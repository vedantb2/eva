"use node";

import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

/** Cheap gateway model for session titles — one-line change later. */
const TEXT_GEN_MODEL = "openai/gpt-5-nano";

/** Strips wrapping quotes the model sometimes adds around the title. */
function cleanGeneratedTitle(raw: string): string {
  let title = raw.trim();
  const wrappedDouble = title.startsWith('"') && title.endsWith('"');
  const wrappedSingle = title.startsWith("'") && title.endsWith("'");
  if ((wrappedDouble || wrappedSingle) && title.length >= 2) {
    title = title.slice(1, -1).trim();
  }
  return title;
}

/**
 * Generates a short session title from the first user message via AI Gateway.
 * Uses flex service tier (~0.5x cost, higher latency OK — titles are background).
 * Non-fatal: missing key / model errors leave the placeholder title in place.
 * If flex can't be applied, Gateway falls back to default tier/rate (best-effort).
 */
export const generateSessionTitle = internalAction({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const { text } = await generateText({
        model: TEXT_GEN_MODEL,
        prompt: `Generate a concise 3-8 word title for this coding task. Summarize the request, don't restate it. Reply with the title only — no quotes, no trailing punctuation.\n\nTask: ${args.message.slice(0, 2000)}`,
        providerOptions: {
          gateway: {
            serviceTier: "flex",
          },
        },
      });
      const title = cleanGeneratedTitle(text);
      if (!title) {
        return null;
      }
      await ctx.runMutation(internal.sessions.applyGeneratedTitle, {
        sessionId: args.sessionId,
        title,
      });
    } catch (error) {
      console.error("[textGen.generateSessionTitle]", error);
    }
    return null;
  },
});
