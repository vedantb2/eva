# Conductor MCP Server

Remote MCP server that lets Claude query the Conductor Convex backend and any connected repo's own Convex database. Users authenticate via Clerk (same account as the web app), then Claude can list repos and run read-only queries against any codebase's database — without credentials ever being returned to the user.

## Setup

```bash
# From repo root
pnpm install
pnpm mcp:dev
```

### MCP Server env vars (Railway / local)

| Variable                | Required   | Description                                                                                              |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `MCP_JWT_SECRET`        | Yes        | Secret key for signing MCP JWT tokens. Generate with `openssl rand -hex 32`                              |
| `CLERK_PUBLISHABLE_KEY` | Yes        | Clerk publishable key (same as web app's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)                            |
| `CLERK_SECRET_KEY`      | Yes        | Clerk secret key for server-side token verification (same as web app's `CLERK_SECRET_KEY`)               |
| `CONDUCTOR_CONVEX_URL`  | Yes        | Conductor Convex deployment URL (e.g. `https://your-project-123.convex.cloud`)                           |
| `BASE_URL`              | Production | Public URL of the server (e.g. `https://convex-mcp.up.railway.app`). Defaults to `http://localhost:PORT` |
| `PORT`                  | No         | Server port. Defaults to `3001`                                                                          |

### Convex env vars (set via Convex dashboard or `npx convex env set`)

The deploy key and JWT secret must also be present in the Convex deployment so the bootstrap endpoint can serve them:

| Variable               | Description                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `CONDUCTOR_DEPLOY_KEY` | Conductor Convex deploy key (read-only recommended). Set this in Convex, not in the MCP server. |
| `MCP_JWT_SECRET`       | Same value as the MCP server's `MCP_JWT_SECRET`. Used to authenticate the bootstrap request.    |

**Migration from v1:** If you previously had `CONDUCTOR_DEPLOY_KEY` in your Railway config, move it to Convex env vars and add `MCP_JWT_SECRET` there as well.

## Deploy to Railway

1. Create a new Railway project, point it at this repo
2. Set the root directory to `apps/mcp-server`
3. Set build command: `pnpm build`
4. Set start command: `node dist/index.js`
5. Add the MCP server env vars listed above (no deploy key needed here)
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
9. Server verifies JWT, bootstraps deploy key from Convex on first request, executes tools
```

### Token Details

- **Access token**: JWT signed with `MCP_JWT_SECRET`, contains `{ sub: clerkUserId }`, expires in 30 days
- **Refresh token**: Same format, expires in 90 days
- **Deploy key**: Fetched once from `GET /api/mcp/bootstrap` and cached in memory — no longer stored in MCP server env vars
- **No persistent token storage**: JWTs are self-contained — verification is just signature + expiry check

### Why Clerk + OAuth 2.0?

The MCP protocol requires OAuth 2.0 for client authentication. Rather than asking users to manually enter Convex credentials, we use Clerk (the same auth provider as the web app) within the OAuth authorize step. Users sign in with their existing Conductor account — no extra credentials needed.

## How Users Connect

1. Open Claude.ai and go to **Settings > Connectors**
2. Click **Add Connector** and enter the server URL (e.g. `https://convex-mcp.up.railway.app/mcp`)
3. Claude discovers the OAuth endpoints automatically
4. A Clerk sign-in page appears — sign in with your Conductor account
5. Done. Claude now has access.

From this point, Claude can query repos and Convex databases:

- "What repos do I have?" → calls `list_repos`
- "What tables does my-app have?" → calls `list_tables` with the repo's ID
- "How many users are in my-app's database?" → calls `run_query` with the repo's ID
- "What tables does Conductor have?" → calls `list_tables` with no repoId

## MCP Tools

| Tool           | Description                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `list_repos`   | List all GitHub repos connected to Conductor. Start here to pick a codebase.                                |
| `list_tables`  | List all tables with declared schema and inferred shapes. Pass `repoId` to target a specific repo's Convex. |
| `query_table`  | Paginated read of documents from a table. Pass `repoId` to target a specific repo's Convex.                 |
| `get_document` | Get a single document by its Convex ID. Pass `repoId` to target a specific repo's Convex.                   |
| `count_table`  | Count total documents in a table. Pass `repoId` to target a specific repo's Convex.                         |
| `run_query`    | Run arbitrary read-only Convex query code. Pass `repoId` to target a specific repo's Convex.                |

The `repoId` param on query tools is optional — omit it to query the Conductor database itself.

### Typical Claude workflow

1. Claude calls `list_repos` → user says "use my-app"
2. Claude calls `list_tables` with `repoId` → sees that repo's database schema
3. Claude calls `run_query` or `query_table` with `repoId` → queries that repo's Convex
4. Credentials are resolved and used internally — never returned in tool output

### How repo credentials are resolved

When a `repoId` is provided, the MCP server:

1. Fetches the repo's env vars from Conductor (using its own deploy key)
2. Looks for `NEXT_PUBLIC_CONVEX_URL` or `CONVEX_URL` and `CONVEX_DEPLOY_KEY` or `CONVEX_ADMIN_KEY`
3. Uses those to make API calls against that repo's Convex deployment
4. Returns only query results — credentials stay in server memory

To enable this, set those env vars for each repo in **Conductor > [Repo] > Settings > Environment Variables**.

## Troubleshooting

- **"Method not supported in stateless mode"** when opening the /mcp URL in a browser — this is normal. The MCP endpoint only works with Claude's client (POST requests), not browser tabs (GET requests).
- **"Invalid or expired token"** — your JWT has expired (30 days) or `MCP_JWT_SECRET` was rotated. Remove and re-add the connector in Claude to reconnect.
- **"Failed to bootstrap deploy key"** — `CONDUCTOR_DEPLOY_KEY` or `MCP_JWT_SECRET` are not set in Convex env vars. Run `npx convex env set CONDUCTOR_DEPLOY_KEY <key>` and `npx convex env set MCP_JWT_SECRET <secret>` in the backend package.
- **Clerk sign-in not loading** — check that `CLERK_PUBLISHABLE_KEY` is set correctly.
- **"Invalid Clerk token"** — the Clerk session token expired before form submission. Refresh the page and try again.
- **"Repo X has no Convex credentials"** — the repo's env vars in Conductor don't include `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY`. Add them via Conductor's env vars settings for that repo.

## Architecture

```
Claude sends request → POST /mcp with Bearer JWT
                            ↓
              Server verifies JWT signature + expiry (MCP_JWT_SECRET)
                            ↓
              On first request: bootstraps deploy key from Convex
              GET /api/mcp/bootstrap (auth: MCPBootstrap {MCP_JWT_SECRET})
                            ↓
              Creates per-request McpServer + StreamableHTTPServerTransport
                            ↓
              Tool handler resolves target Convex (Conductor or repo-specific)
              Repo credentials fetched internally, never returned to Claude
                            ↓
              Returns results to Claude
```

Stateless design — no database or in-memory token cache needed for auth. The JWT is self-contained (`{ sub: clerkUserId }`). The deploy key and repo credentials are cached in memory per process.

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
