import express from "express";
import rateLimit from "express-rate-limit";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getOAuthMetadata,
  getProtectedResourceMetadata,
  renderAuthPage,
  renderHandshakePage,
  processClerkAuth,
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

app.use((req: Request, _res: Response, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many token requests, try again later" },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many registration requests, try again later" },
});

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, try again later" },
});

app.get(
  "/.well-known/oauth-protected-resource",
  (_req: Request, res: Response) => {
    res.json(getProtectedResourceMetadata(getBaseUrl()));
  },
);

app.get(
  "/.well-known/oauth-authorization-server",
  (_req: Request, res: Response) => {
    res.json(getOAuthMetadata(getBaseUrl()));
  },
);

app.post("/oauth/register", registerLimiter, (req: Request, res: Response) => {
  console.log("  Registration body:", JSON.stringify(req.body));
  const body =
    typeof req.body === "object" && req.body !== null ? req.body : {};
  res.status(201).json(handleClientRegistration(body));
});

app.get("/oauth/authorize", (req: Request, res: Response) => {
  try {
    const query = queryToStringRecord(req);
    const html = renderAuthPage(query);
    res.type("html").send(html);
  } catch (err) {
    console.error("  Authorize error:", err);
    res.status(400).send("Invalid authorization request");
  }
});

app.post("/oauth/authorize", async (req: Request, res: Response) => {
  try {
    const body = bodyToStringRecord(req);
    const redirectUrl = await processClerkAuth(body);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("  Auth callback error:", err);
    res.status(400).send("Authentication failed");
  }
});

app.post("/oauth/token", tokenLimiter, async (req: Request, res: Response) => {
  const body = bodyToStringRecord(req);
  console.log("  Token request grant_type:", body.grant_type);
  const result = await exchangeToken(body);
  if (result.ok) {
    console.log("  Token exchange success");
    res.json(result.response);
  } else {
    console.log("  Token exchange failed:", result.error.error);
    res.status(400).json(result.error);
  }
});

async function handleMcpPost(req: Request, res: Response) {
  const baseUrl = getBaseUrl();
  const resourceMetadataUrl = `${baseUrl}/.well-known/oauth-protected-resource`;

  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    console.log("  401: no token, sending WWW-Authenticate");
    res.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${resourceMetadataUrl}"`,
    );
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  const credentials = await verifyToken(token);
  if (!credentials) {
    res.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${resourceMetadataUrl}"`,
    );
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  try {
    console.log("  MCP: authenticated, handling request");
    const server = createMcpServer(credentials);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    console.log("  MCP: request handled ok");
  } catch (err) {
    console.error("  MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

function handleMcpUnsupported(_req: Request, res: Response) {
  res.status(405).json({ error: "Method not supported in stateless mode" });
}

function handleMcpGet(req: Request, res: Response) {
  if (req.query.__clerk_handshake) {
    const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
    if (publishableKey) {
      res.type("html").send(renderHandshakePage(publishableKey));
      return;
    }
  }
  handleMcpUnsupported(req, res);
}

app.post("/", mcpLimiter, handleMcpPost);
app.get("/", handleMcpGet);
app.delete("/", handleMcpUnsupported);

app.post("/mcp", mcpLimiter, handleMcpPost);
app.get("/mcp", handleMcpGet);
app.delete("/mcp", handleMcpUnsupported);

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
