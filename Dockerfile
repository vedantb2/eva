FROM node:20-bullseye

# System dependencies
RUN apt-get update && apt-get install -y git curl

# Use Node's built-in corepack for pnpm (matches packageManager version in package.json)
RUN corepack enable

# Claude Code CLI and browser agent for AI execution
RUN npm install -g @anthropic-ai/claude-code agent-browser convex

# Playwright system dependencies (Chromium libs)
RUN npx playwright install-deps chromium

# VS Code web editor for session sandbox (pre-built binary, no compilation needed)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Non-root user (required: Claude Code blocks --dangerously-skip-permissions as root)
RUN useradd -m -s /bin/bash eva && mkdir -p /workspace && chown eva:eva /workspace

USER eva

# Install Playwright Chromium browser binary as non-root user
RUN npx playwright install chromium
WORKDIR /workspace

# Pre-install Claude Code plugins for design skills
RUN mkdir -p /home/eva/.claude/plugins/marketplaces
RUN git clone --depth 1 https://github.com/anthropics/claude-plugins-official.git \
    /home/eva/.claude/plugins/marketplaces/claude-plugins-official
RUN git clone --depth 1 https://github.com/Dammyjay93/interface-design.git \
    /home/eva/.claude/plugins/marketplaces/Dammyjay93
RUN echo '{"enabledPlugins":{"frontend-design@claude-plugins-official":true,"interface-design@Dammyjay93":true}}' \
    > /home/eva/.claude/settings.json

# pnpm global bin directory for non-root user
ENV PNPM_HOME=/home/eva/.pnpm
ENV NODE_PATH=/usr/lib/node_modules
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

ARG GITHUB_TOKEN
RUN git clone https://x-access-token:${GITHUB_TOKEN}@github.com/vedantb2/conductor.git repo

# Pre-install dependencies so sandbox startup only needs git pull + pnpm install delta
WORKDIR /workspace/repo/apps/web
RUN pnpm install