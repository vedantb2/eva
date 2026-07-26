#!/usr/bin/env bash
# Wrap a raw eva screenshot in the brand presentation frame: gradient canvas,
# rounded card, eva mark + wordmark above.
#   usage: frame.sh <slug> [title] [raw-png-path]
#     slug   the slug used with shot.sh; reads screenshots/<today>-<slug>.png
#            and writes screenshots/<today>-<slug>-framed.png
#     title  wordmark text (default "Eva")
#     raw    override the input path (for reframing an older shot)
#
# Renders templates/frame.html headless at 1600x900 via agent-browser. Post the
# -framed.png; keep the raw one for reuse at other sizes.
set -eu
ROOT="C:/Vedant/Personal/GitHub/eva"
SHOTS="${ROOT}/screenshots"
SKILL="${ROOT}/.claude/skills/eva-feature-screenshot"
ICON="${ROOT}/apps/web/public/icon.svg"

slug="$1"; title="${2:-Eva}"
raw="${3:-${SHOTS}/$(date +%Y-%m-%d)-${slug}.png}"
out="${raw%.png}-framed.png"
page="${SHOTS}/.frame-${slug}.html"

[ -f "$raw" ] || { echo "no such screenshot: $raw" >&2; exit 1; }

# file:// URLs need forward slashes and no drive-colon escaping issues; the paths
# are already POSIX-style absolute Windows paths.
python - "$slug" "$title" "$raw" "$page" <<'PY'
import sys, pathlib
slug, title, raw, page = sys.argv[1:5]
tpl = pathlib.Path(r"C:/Vedant/Personal/GitHub/eva/.claude/skills/eva-feature-screenshot/templates/frame.html").read_text(encoding="utf-8")
html = (tpl
        .replace("__IMG__", "file:///" + raw)
        .replace("__ICON__", "file:///C:/Vedant/Personal/GitHub/eva/apps/web/public/icon.svg")
        .replace("__TITLE__", title))
pathlib.Path(page).write_text(html, encoding="utf-8")
PY

timeout 60 agent-browser set viewport 1600 900 >/dev/null 2>&1
timeout 90 agent-browser open "file:///${page}" >/dev/null 2>&1
timeout 30 agent-browser wait 1200 >/dev/null 2>&1
timeout 60 agent-browser screenshot "$out" 2>&1 | tail -1

rm -f "$page"
# Leave the browser back at the app's capture viewport.
timeout 60 agent-browser set viewport 1280 720 >/dev/null 2>&1
echo "framed: $out"
