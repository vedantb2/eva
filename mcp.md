    "sentry": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server", "--access-token", "${SENTRY_ACCESS_TOKEN}"]
    },
    "supabase-db": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "${SUPABASE_ACCESS_TOKEN}"]
    },
    "posthog": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.posthog.com/sse", "--header", "Authorization:Bearer ${POSTHOG_API_KEY}"]
    }
