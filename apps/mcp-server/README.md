# Convex MCP Server

Remote MCP server that lets Claude query any Convex deployment's data. Users connect once via OAuth, then Claude can list tables, read documents, and run arbitrary read-only queries.

## Setup

```bash
# From repo root
pnpm install
pnpm mcp:dev
```

Required env vars:

| Variable         | Required   | Description                                                                                              |
| ---------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `MCP_JWT_SECRET` | Yes        | Secret key for signing JWT tokens. Generate with `openssl rand -hex 32`                                  |
| `BASE_URL`       | Production | Public URL of the server (e.g. `https://convex-mcp.up.railway.app`). Defaults to `http://localhost:PORT` |
| `PORT`           | No         | Server port. Defaults to `3001`                                                                          |

## Deploy to Railway

1. Create a new Railway project, point it at this repo
2. Set the root directory to `apps/mcp-server`
3. Set build command: `pnpm build`
4. Set start command: `node dist/index.js`
5. Add env vars: `MCP_JWT_SECRET` (generate a random 32+ char secret), `BASE_URL` (Railway will give you a public URL)
6. Deploy

## How Users Connect

1. Open Claude.ai (or Claude Desktop) and go to **Settings > Connectors**
2. Click **Add Connector** and enter the server URL (e.g. `https://convex-mcp.up.railway.app/mcp`)
3. Claude discovers the OAuth endpoints automatically via `/.well-known/oauth-authorization-server`
4. A login page appears asking for:
   - **Deployment URL** — from Convex dashboard (e.g. `https://your-project-123.convex.cloud`)
   - **Deploy Key** — generate in Convex dashboard under Settings > Deploy Keys (use a read-only key)
5. Submit — OAuth completes, Claude now has access

From this point, Claude can query the Convex database directly. Ask things like:

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

## Architecture

```
Claude sends request → POST /mcp with Bearer JWT
                            ↓
              Server verifies JWT → looks up token ID → gets Convex credentials
                            ↓
              Creates per-request McpServer + StreamableHTTPServerTransport
                            ↓
              Tool handler calls Convex system APIs with deploy key
                            ↓
              Returns results to Claude
```

Stateless design — no database needed. Convex credentials are stored server-side in an in-memory token store (keyed by opaque token ID in the JWT). If the server restarts, users re-authenticate via the OAuth flow.

## Endpoints

| Method | Path                                      | Purpose                                  |
| ------ | ----------------------------------------- | ---------------------------------------- |
| GET    | `/.well-known/oauth-authorization-server` | OAuth discovery metadata                 |
| POST   | `/oauth/register`                         | Dynamic client registration              |
| GET    | `/oauth/authorize`                        | Shows credential entry form              |
| POST   | `/oauth/authorize`                        | Processes form, redirects with auth code |
| POST   | `/oauth/token`                            | Exchanges auth code for JWT (with PKCE)  |
| POST   | `/mcp`                                    | MCP Streamable HTTP endpoint             |
| GET    | `/health`                                 | Health check                             |
