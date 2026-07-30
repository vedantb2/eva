#!/usr/bin/env bash
# HD screenshot of one eva screen for a feature-announcement tweet.
#   usage: shot.sh <url-path> <slug> [settle-ms] [--no-collapse]
#     url-path   path under localhost:5173, e.g. /vvedantb/eva/web/sessions
#     slug       output name; file lands at screenshots/<today>-<slug>.png (2560x1440)
#     settle-ms  extra pause after networkidle (default 3000) — raise it if the
#                shot catches skeletons or spinners
#     --no-collapse  leave the sidebar expanded (only when the sidebar IS the feature)
#
# Thin wrapper over scripts/hd-shot.mjs, which drives a real Chrome at
# deviceScaleFactor 2 so the 1280 layout is captured crisp at 2560x1440.
# agent-browser cannot do this — it captures at CSS pixels and discards DPR.
#
# For a STAGED shot (open a menu, type a prompt, then capture) don't use this
# wrapper — call hd-shot.mjs directly with a --recipe (see SKILL.md).
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -W)"
path="$1"; slug="$2"; settle="${3:-3000}"
extra=""
[ "${4:-}" = "--no-collapse" ] && extra="--no-collapse"

MSYS_NO_PATHCONV=1 node "${SCRIPT_DIR}/hd-shot.mjs" \
  --path "$path" --slug "$slug" --settle "$settle" $extra
