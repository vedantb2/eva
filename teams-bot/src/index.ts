import "dotenv/config";
import express from "express";
import {
  CloudAdapter,
  ActivityHandler,
  TurnContext,
  MessageFactory,
  AuthConfiguration,
} from "@microsoft/agents-hosting";
import { lookupRepo } from "./repo.js";
import { askQuestion } from "./ask.js";

interface RepoContext {
  owner: string;
  name: string;
  installationId: number;
}

const repoContexts = new Map<string, RepoContext>();

function parseRepoFromText(text: string): { owner: string; name: string } | null {
  const match = text.match(/(?:^|\s)([\w.-]+)\/([\w.-]+)/);
  if (!match) return null;
  return { owner: match[1], name: match[2] };
}

class EvaBot extends ActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context: TurnContext, next: () => Promise<void>) => {
      const text = context.activity.text?.trim() || "";
      const conversationId = context.activity.conversation?.id || "";

      if (text.startsWith("/repo ")) {
        const parsed = parseRepoFromText(text.slice(6));
        if (!parsed) {
          await context.sendActivity(
            MessageFactory.text("Invalid format. Use: /repo owner/name")
          );
          await next();
          return;
        }

        const repo = await lookupRepo(parsed.owner, parsed.name);
        if (!repo) {
          await context.sendActivity(
            MessageFactory.text(
              `Repository ${parsed.owner}/${parsed.name} not found in Conductor.`
            )
          );
          await next();
          return;
        }

        repoContexts.set(conversationId, {
          owner: repo.owner,
          name: repo.name,
          installationId: repo.installationId,
        });
        await context.sendActivity(
          MessageFactory.text(
            `Repo set to ${repo.owner}/${repo.name}. You can now ask questions about this codebase.`
          )
        );
        await next();
        return;
      }

      const repoCtx = repoContexts.get(conversationId);
      if (!repoCtx) {
        await context.sendActivity(
          MessageFactory.text(
            "Please set a repo first with: /repo owner/name"
          )
        );
        await next();
        return;
      }

      await context.sendActivity({ type: "typing" });
      await context.sendActivity(
        MessageFactory.text("Let me explore the codebase...")
      );

      try {
        const answer = await askQuestion(conversationId, text, repoCtx);
        await context.sendActivity(MessageFactory.text(answer));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        await context.sendActivity(
          MessageFactory.text(`Sorry, something went wrong: ${message}`)
        );
      }

      await next();
    });

    this.onMembersAdded(
      async (context: TurnContext, next: () => Promise<void>) => {
        const membersAdded = context.activity.membersAdded || [];
        for (const member of membersAdded) {
          if (member.id !== context.activity.recipient?.id) {
            await context.sendActivity(
              MessageFactory.text(
                "Hi! I'm Eva. Set a repo with /repo owner/name, then ask me anything about the codebase."
              )
            );
          }
        }
        await next();
      }
    );
  }
}

const authConfig: AuthConfiguration = {
  clientId: process.env.MICROSOFT_APP_ID || "",
  clientSecret: process.env.MICROSOFT_APP_PASSWORD || "",
  tenantId: process.env.MICROSOFT_APP_TENANT_ID,
};

const adapter = new CloudAdapter(authConfig);
adapter.onTurnError = async (context: TurnContext, error: Error) => {
  console.error(`[onTurnError] ${error.message}`);
  await context.sendActivity(
    MessageFactory.text("Eva encountered an error. Please try again.")
  );
};

const bot = new EvaBot();

const app = express();
app.use(express.json());

app.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, async (context: TurnContext) => {
    await bot.run(context);
  });
});

const port = process.env.PORT || 3978;
app.listen(port, () => {
  console.log(`Eva Teams bot listening on port ${port}`);
});
