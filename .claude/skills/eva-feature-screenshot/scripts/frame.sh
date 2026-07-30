#!/usr/bin/env bash
# Wrap a raw HD eva screenshot in the brand presentation frame: gradient canvas,
# rounded card, eva mark + wordmark above.
#   usage: frame.sh <slug> [title] [raw-png-path]
#     slug   the slug used with shot.sh; reads screenshots/<today>-<slug>.png
#            and writes screenshots/<today>-<slug>-framed.png (3200x1800)
#     title  wordmark text (default "Eva")
#     raw    override the input path (for reframing an older shot)
#
# Thin wrapper over scripts/hd-frame.mjs, which renders templates/frame.html
# through a real Chrome at deviceScaleFactor 2 → 3200x1800. Post the -framed.png.
set -eu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -W)"
slug="$1"; title="${2:-Eva}"

args=(--slug "$slug" --title "$title")
[ -n "${3:-}" ] && args+=(--raw "$3")

MSYS_NO_PATHCONV=1 node "${SCRIPT_DIR}/hd-frame.mjs" "${args[@]}"
