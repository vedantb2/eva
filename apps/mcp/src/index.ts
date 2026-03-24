import express from "express";
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
  mintInternalToken,
} from "./auth.js";
import { registerTools } from "./tools.js";
import { registerSupabaseTools } from "./supabase-proxy.js";
import type { ConvexCredentials } from "./auth.js";
import type { Request, Response } from "express";

async function createMcpServer(
  credentials: ConvexCredentials,
): Promise<McpServer> {
  const server = new McpServer({
    name: "convex-mcp",
    version: "1.0.0",
  });
  registerTools(server, credentials);
  await registerSupabaseTools(server, credentials);
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

export const app = express();

app.use((req: Request, _res: Response, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.post("/oauth/register", (req: Request, res: Response) => {
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

app.post("/oauth/token", async (req: Request, res: Response) => {
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
    const server = await createMcpServer(credentials);
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

app.post("/", handleMcpPost);
app.get("/", handleMcpGet);
app.delete("/", handleMcpUnsupported);

app.post("/mcp", handleMcpPost);
app.get("/mcp", handleMcpGet);
app.delete("/mcp", handleMcpUnsupported);

app.post("/api/internal/mint-token", (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("MCPBootstrap ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const secret = auth.slice("MCPBootstrap ".length);
  const body = bodyToStringRecord(req);
  const result = mintInternalToken(body, secret);
  if (!result) {
    res.status(403).json({ error: "Invalid credentials or request" });
    return;
  }
  res.json(result);
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT ?? "3001", 10);
  app.listen(port, () => {
    console.log(`Convex MCP server listening on port ${port}`);
    console.log(
      `OAuth metadata: ${getBaseUrl()}/.well-known/oauth-authorization-server`,
    );
    console.log(`MCP endpoint: ${getBaseUrl()}/mcp`);
  });
}
