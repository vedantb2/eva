#!/usr/bin/env bash
# Screenshot one eva screen for a feature-announcement tweet.
#   usage: shot.sh <url-path|-> <slug> [settle-ms]
#     url-path   path under localhost:5173, e.g. /vvedantb/eva/web/sessions
#                pass "-" to shoot the CURRENT page state without navigating
#                (use after you have opened a modal / staged some input)
#     slug       output name; file lands at screenshots/<today>-<slug>.png
#     settle-ms  extra pause after networkidle (default 3000) — raise it if the
#                shot catches skeletons or spinners
#
# Assumes the browser is already at viewport 1280x720 and signed in as the agent
# user (see SKILL.md step 2). Hides the react-scan / agentation dev overlays,
# which would otherwise land in frame.
set -u
BASE="http://localhost:5173"
OUT_DIR="C:/Vedant/Personal/GitHub/eva/screenshots"
path="$1"; slug="$2"; settle="${3:-3000}"
out="${OUT_DIR}/$(date +%Y-%m-%d)-${slug}.png"

mkdir -p "$OUT_DIR"

if [ "$path" != "-" ]; then
  timeout 90 agent-browser open "${BASE}${path}" >/dev/null 2>&1
  timeout 60 agent-browser wait --load networkidle >/dev/null 2>&1
fi
timeout 30 agent-browser wait "$settle" >/dev/null 2>&1

# Dev overlays are THREE nodes, all mounted on <html> rather than <body>:
# #react-scan-root (toolbar, shadow root), a bare <html> > <canvas> (the component
# outlines and labels — the one that actually ruins a shot), and
# [data-agentation-root]. All carry inline styles, so set display:none inline.
timeout 60 agent-browser eval "const kill=(el)=>{if(el)el.style.setProperty('display','none','important')};kill(document.getElementById('react-scan-root'));document.documentElement.querySelectorAll(':scope > canvas').forEach(kill);document.querySelectorAll('[data-agentation-root]').forEach(kill);'hidden'" >/dev/null 2>&1

timeout 60 agent-browser screenshot "$out" 2>&1 | tail -1
timeout 30 agent-browser get url
echo "saved: $out"
