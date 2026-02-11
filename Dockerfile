FROM node:20-bullseye

# System dependencies
RUN apt-get update && apt-get install -y git curl

# Use Node's built-in corepack for pnpm (matches packageManager version in package.json)
RUN corepack enable

# Claude Code CLI and browser agent for AI execution
RUN npm install -g @anthropic-ai/claude-code agent-browser

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

# pnpm global bin directory for non-root user
ENV PNPM_HOME=/home/eva/.pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

ARG GITHUB_TOKEN
RUN git clone https://x-access-token:${GITHUB_TOKEN}@github.com/vedantb2/conductor.git repo

# Pre-install dependencies so sandbox startup only needs git pull + pnpm install delta
WORKDIR /workspace/repo/apps/web
RUN pnpm install