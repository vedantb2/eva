# Figma & Linear Plugin Auth in Docker

## Installing Plugins

The Linear and Figma plugins are in the `claude-plugins-official` repo. Enable them in `settings.json`:

```dockerfile
# Already cloned in Dockerfile
RUN git clone --depth 1 https://github.com/anthropics/claude-plugins-official.git \
    /home/eva/.claude/plugins/marketplaces/claude-plugins-official

# Enable all desired plugins
RUN echo '{"enabledPlugins":{"frontend-design@claude-plugins-official":true,"interface-design@Dammyjay93":true,"linear@claude-plugins-official":true,"figma@claude-plugins-official":true}}' \
    > /home/eva/.claude/settings.json
```

**ClickUp** does not have an official plugin — only an MCP server with OAuth (no API keys), impractical for headless Docker.

## Authenticating Linear & Figma

Plugins bundle MCP servers that need auth tokens. Write a `.mcp.json` file in the Dockerfile:

```dockerfile
RUN cat > /home/eva/.claude/.mcp.json << 'EOF'
{
  "mcpServers": {
    "linear": {
      "type": "http",
      "url": "https://mcp.linear.com/mcp",
      "headers": {
        "Authorization": "Bearer ${LINEAR_TOKEN}"
      }
    },
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "headers": {
        "Authorization": "Bearer ${FIGMA_TOKEN}"
      }
    }
  }
}
EOF
```

Pass tokens at runtime:

```bash
docker run -e LINEAR_TOKEN=lin_api_xxx -e FIGMA_TOKEN=figd_xxx my-image
```

## Getting the Tokens

| Service     | How to get token                             | Required scopes                              |
| ----------- | -------------------------------------------- | -------------------------------------------- |
| **Linear**  | Settings > API > Personal API keys           | Standard (no special scopes)                 |
| **Figma**   | Settings > Security > Personal access tokens | **design access** + **server config** scopes |
| **ClickUp** | OAuth only (no personal API keys)            | Not practical for Docker                     |

**Figma caveat**: If you created a Figma token before the Dev MCP feature existed, regenerate it to get the required "server config" scope.
