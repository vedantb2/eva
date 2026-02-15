import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifySignedCallbackToken } from "./callbackTokens";

const http = httpRouter();

http.route({
  path: "/daytona/command-complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: { token?: string };
    try {
      body = (await request.json()) as { token?: string };
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const token = body.token;
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing token" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const secret = process.env.DAYTONA_CALLBACK_SECRET;
    if (!secret) {
      return new Response(
        JSON.stringify({ ok: false, error: "Server callback secret missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const payload = await verifySignedCallbackToken(token, secret);
    if (!payload) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const tracker = await ctx.runQuery(
      internal.workflowCommands.getByCallbackTokenIdInternal,
      {
        callbackTokenId: payload.tokenId,
      },
    );

    if (!tracker) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      payload.trackerId !== String(tracker._id) ||
      payload.workflowId !== tracker.workflowId ||
      Date.now() > tracker.callbackExpiresAt
    ) {
      return new Response(
        JSON.stringify({ ok: false, error: "Token payload mismatch" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      await ctx.runAction(
        internal.taskWorkflowActions.finalizeWorkflowCommand,
        {
          trackerId: tracker._id,
          completionSource: "callback",
        },
      );
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("daytona/command-complete finalize failed", error);
      return new Response(
        JSON.stringify({
          ok: true,
          accepted: true,
          note: "Callback accepted; poll fallback will continue",
        }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }),
});

export default http;
