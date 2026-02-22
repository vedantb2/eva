# Conductor MCP Server

Remote MCP server that lets Claude query the Conductor Convex backend. Users authenticate via Clerk (same account as the web app), then Claude can list tables, read documents, and run arbitrary read-only queries.

## Setup

```bash
# From repo root
pnpm install
pnpm mcp:dev
```

Required env vars:

| Variable                | Required   | Description                                                                                              |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `MCP_JWT_SECRET`        | Yes        | Secret key for signing MCP JWT tokens. Generate with `openssl rand -hex 32`                              |
| `CLERK_PUBLISHABLE_KEY` | Yes        | Clerk publishable key (same as web app's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)                            |
| `CLERK_SECRET_KEY`      | Yes        | Clerk secret key for server-side token verification (same as web app's `CLERK_SECRET_KEY`)               |
| `CONDUCTOR_CONVEX_URL`  | Yes        | Conductor Convex deployment URL (e.g. `https://your-project-123.convex.cloud`)                           |
| `CONDUCTOR_DEPLOY_KEY`  | Yes        | Conductor Convex deploy key (read-only recommended)                                                      |
| `BASE_URL`              | Production | Public URL of the server (e.g. `https://convex-mcp.up.railway.app`). Defaults to `http://localhost:PORT` |
| `PORT`                  | No         | Server port. Defaults to `3001`                                                                          |

## Deploy to Railway

1. Create a new Railway project, point it at this repo
2. Set the root directory to `apps/mcp-server`
3. Set build command: `pnpm build`
4. Set start command: `node dist/index.js`
5. Add all required env vars listed above
6. Deploy

## Authentication

The server uses **OAuth 2.0 with PKCE**, with **Clerk** as the identity provider.

### Flow

```
1. Claude.ai discovers OAuth endpoints via /.well-known/oauth-authorization-server
2. Claude.ai redirects user to GET /oauth/authorize
3. Server renders Clerk sign-in widget (loaded from Clerk CDN)
4. User signs in with their Conductor account (email, Google, etc.)
5. Client-side JS gets Clerk session token, auto-submits to POST /oauth/authorize
6. Server verifies Clerk token via @clerk/backend, generates OAuth auth code
7. Claude.ai exchanges code for JWT via POST /oauth/token (PKCE verified)
8. Claude.ai sends requests to POST /mcp with Bearer JWT
9. Server verifies JWT, resolves Convex credentials from env vars, executes tools
```

### Token Details

- **Access token**: JWT signed with `MCP_JWT_SECRET`, contains `{ sub: clerkUserId }`, expires in 30 days
- **Refresh token**: Same format, expires in 90 days
- **Convex credentials**: Always from `CONDUCTOR_CONVEX_URL` + `CONDUCTOR_DEPLOY_KEY` env vars (not per-user)
- **No persistent token storage**: JWTs are self-contained — verification is just signature + expiry check

### Why Clerk + OAuth 2.0?

The MCP protocol requires OAuth 2.0 for client authentication. Rather than asking users to manually enter Convex credentials, we use Clerk (the same auth provider as the web app) within the OAuth authorize step. Users sign in with their existing Conductor account — no extra credentials needed.

## How Users Connect

1. Open Claude.ai and go to **Settings > Connectors**
2. Click **Add Connector** and enter the server URL (e.g. `https://convex-mcp.up.railway.app/mcp`)
3. Claude discovers the OAuth endpoints automatically
4. A Clerk sign-in page appears — sign in with your Conductor account
5. Done. Claude now has access.

From this point, Claude can query the Convex database directly:

- "What tables do I have?"
- "Show me the last 10 users who signed up"
- "How many tasks are in the 'done' status?"
- "Find all sessions created in the last 24 hours"

## MCP Tools

| Tool           | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `list_tables`  | Lists all tables with declared schema and inferred shapes                |
| `query_table`  | Paginated read of documents from a table (supports ordering, cursor)     |
| `get_document` | Get a single document by its Convex ID                                   |
| `count_table`  | Count total documents in a table                                         |
| `run_query`    | Run arbitrary read-only Convex query code (joins, filters, aggregations) |

`run_query` is the most powerful — Claude writes Convex server-side JavaScript and executes it read-only. Example: Claude might run `const tasks = await ctx.db.query("agentTasks").collect(); return tasks.filter(t => t.status === "done").length;` to answer "how many tasks are done?"

## Troubleshooting

- **"Method not supported in stateless mode"** when opening the /mcp URL in a browser — this is normal. The MCP endpoint only works with Claude's client (POST requests), not browser tabs (GET requests).
- **"Invalid or expired token"** — your JWT has expired (30 days) or `MCP_JWT_SECRET` was rotated. Remove and re-add the connector in Claude to reconnect.
- **Clerk sign-in not loading** — check that `CLERK_PUBLISHABLE_KEY` is set correctly. The Clerk JS SDK is loaded from the CDN URL derived from this key.
- **"Invalid Clerk token"** — the Clerk session token expired before form submission (tokens live ~60 seconds). Refresh the page and try again. Also check that `CLERK_SECRET_KEY` matches the web app's key.

## Architecture

```
Claude sends request → POST /mcp with Bearer JWT
                            ↓
              Server verifies JWT signature + expiry (MCP_JWT_SECRET)
                            ↓
              Resolves Convex credentials from CONDUCTOR_* env vars
                            ↓
              Creates per-request McpServer + StreamableHTTPServerTransport
                            ↓
              Tool handler calls Convex system APIs with deploy key
                            ↓
              Returns results to Claude
```

Stateless design — no database or in-memory token cache needed. The JWT is self-contained (`{ sub: clerkUserId }`), and Convex credentials come from env vars. Server restarts don't affect existing connections.

## Endpoints

| Method | Path                                      | Purpose                                     |
| ------ | ----------------------------------------- | ------------------------------------------- |
| GET    | `/.well-known/oauth-authorization-server` | OAuth discovery metadata                    |
| GET    | `/.well-known/oauth-protected-resource`   | Protected resource metadata                 |
| POST   | `/oauth/register`                         | Dynamic client registration                 |
| GET    | `/oauth/authorize`                        | Renders Clerk sign-in page                  |
| POST   | `/oauth/authorize`                        | Verifies Clerk token, redirects with code   |
| POST   | `/oauth/token`                            | Exchanges auth code for JWT (PKCE verified) |
| POST   | `/mcp` (or `/`)                           | MCP Streamable HTTP endpoint                |
| GET    | `/health`                                 | Health check                                |
