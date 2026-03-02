# Update rebuild-snapshot.yml workflow

Update the `.github/workflows/rebuild-snapshot.yml` file in this repo:

1. Remove the `custom_commands` and `custom_env_vars` workflow_dispatch inputs — only keep `snapshot_name`
2. Remove the `CUSTOM_ENV_VARS` and `CUSTOM_COMMANDS` env vars from the "Generate Dockerfile" step
3. Remove the two `printf` lines that inject custom env vars and commands into the Dockerfile:
   - `printf '%s' "$CUSTOM_ENV_VARS" | jq -r ...`
   - `printf '%s' "$CUSTOM_COMMANDS" | jq -r ...`
4. Merge the two heredoc blocks (`BASEEOF` and `TAILEOF`) into a single `EOF` block since there's no longer anything injected between them
5. Make sure `WORKDIR` is set to the monorepo root (e.g. `/workspace/repo`) and `pnpm install` runs from there — NOT from a subdirectory like `/workspace/repo/apps/web`
6. The `DAYTONA_API_KEY` secret is still required — do not remove it
7. The `SNAPSHOT_GITHUB_PAT` secret is no longer needed — it can be removed from the repo secrets if present

The workflow is dispatched by the platform (Convex) which passes `snapshot_name` as an input. Custom setup commands and env vars are no longer managed from the platform — they should be hardcoded directly in the Dockerfile within this workflow file if needed.
