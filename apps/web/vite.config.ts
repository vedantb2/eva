import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tanstackRouter from "@tanstack/router-plugin/vite";
import path from "path";

function agentLoginPlugin(): Plugin {
  let env: Record<string, string>;

  return {
    name: "agent-login",
    configureServer(server) {
      env = loadEnv("development", server.config.root, "");

      server.middlewares.use("/api/auth/agent-login", async (_req, res) => {
        const secretKey = env.CLERK_SECRET_KEY;
        const agentUserId = env.AGENT_CLERK_USER_ID;

        if (!secretKey || !agentUserId) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error:
                "CLERK_SECRET_KEY and AGENT_CLERK_USER_ID must be set in .env.local",
            }),
          );
          return;
        }

        const resp = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: agentUserId,
            expires_in_seconds: 60,
          }),
        });

        if (!resp.ok) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Failed to create sign-in token",
              details: await resp.text(),
            }),
          );
          return;
        }

        const data = await resp.json();
        const token = data.token;
        if (typeof token !== "string") {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No token in Clerk response" }));
          return;
        }

        res.writeHead(302, {
          Location: `/agent-callback?ticket=${encodeURIComponent(token)}`,
        });
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "./src/routes",
      routeFileIgnorePattern:
        "(_components|_utils\\.ts|Client\\.tsx|Panel\\.tsx)",
    }),
    react(),
    agentLoginPlugin(),
  ],
  server: {
    host: "0.0.0.0",
    cors: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
