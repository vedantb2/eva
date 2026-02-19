import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getOAuthMetadata,
  renderAuthForm,
  processAuthForm,
  exchangeToken,
  handleClientRegistration,
  verifyToken,
  extractBearerToken,
} from "./auth.js";
import { registerTools } from "./tools.js";
import type { ConvexCredentials } from "./auth.js";
import type { Request, Response } from "express";

function createMcpServer(credentials: ConvexCredentials): McpServer {
  const server = new McpServer({
    name: "convex-mcp",
    version: "1.0.0",
  });
  registerTools(server, credentials);
  return server;
}

function getBaseUrl(): string {
  const base = process.env.BASE_URL;
  if (base) return base.replace(/\/$/, "");
  const port = process.env.PORT ?? "3001";
  return `http://localhost:${port}`;
}

function bodyToStringRecord(req: Request): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof req.body === "object" && req.body !== null) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string") {
        result[key] = value;
      }
    }
  }
  return result;
}

function queryToStringRecord(req: Request): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(
  "/.well-known/oauth-authorization-server",
  (_req: Request, res: Response) => {
    res.json(getOAuthMetadata(getBaseUrl()));
  },
);

app.post("/oauth/register", (_req: Request, res: Response) => {
  res.status(201).json(handleClientRegistration());
});

app.get("/oauth/authorize", (req: Request, res: Response) => {
  try {
    const query = queryToStringRecord(req);
    const html = renderAuthForm(query);
    res.type("html").send(html);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    res.status(400).send(message);
  }
});

app.post("/oauth/authorize", (req: Request, res: Response) => {
  try {
    const body = bodyToStringRecord(req);
    const redirectUrl = processAuthForm(body);
    res.redirect(redirectUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    res.status(400).send(message);
  }
});

app.post("/oauth/token", (req: Request, res: Response) => {
  const body = bodyToStringRecord(req);
  const result = exchangeToken(body);
  if (result.ok) {
    res.json(result.response);
  } else {
    res.status(400).json(result.error);
  }
});

app.post("/mcp", async (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  const credentials = verifyToken(token);
  if (!credentials) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  try {
    const server = createMcpServer(credentials);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  }
});

app.get("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({ error: "SSE not supported in stateless mode" });
});

app.delete("/mcp", (_req: Request, res: Response) => {
  res
    .status(405)
    .json({ error: "Session deletion not supported in stateless mode" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const port = parseInt(process.env.PORT ?? "3001", 10);
app.listen(port, () => {
  console.log(`Convex MCP server listening on port ${port}`);
  console.log(
    `OAuth metadata: ${getBaseUrl()}/.well-known/oauth-authorization-server`,
  );
  console.log(`MCP endpoint: ${getBaseUrl()}/mcp`);
});
