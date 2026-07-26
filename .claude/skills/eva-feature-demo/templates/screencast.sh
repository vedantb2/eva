#!/usr/bin/env bash
# Take script for one eva feature screencast. Copy to the scratchpad, fill in the
# FLOW section, dry-run with RECORD=0, then record once with RECORD=1.
#
#   RECORD=0 bash take.sh     # rehearse — no video, no action log
#   RECORD=1 bash take.sh     # the take → recordings/<SLUG>.webm
#                             #          + recordings/<SLUG>.actions.json
#
# The action log is what drives the zoom pass (render-screencast.mjs): every tap /
# say / go below records the moment and the on-screen position of that action, so
# the camera can push in on it afterwards. Use the helpers — a hand-written
# `agent-browser click` is invisible to the zoom pass AND has no click ring.
#
# Assumes the browser is already signed in as the agent user. Viewport, theme and
# overlay-hiding all happen BEFORE record start so none of it lands in frame.
set -u

SLUG="my-feature"                 # ← output name
BASE="http://localhost:5173"
REPO="/vvedantb/eva/web"          # own repo only — never a client repo
REC="C:/Vedant/Personal/GitHub/eva/recordings"
OUT="${REC}/${SLUG}.webm"
LOG="${REC}/${SLUG}.actions.json"
RECORD="${RECORD:-0}"

mkdir -p "$REC"

ab() { timeout 90 agent-browser "$@"; }

# --- action log ---------------------------------------------------------------
T0=0
ACTIONS=""

now_ms() { date +%s%3N; }

# mark <kind> <x> <y> [label] [typed-text] — kind is click | type | nav
# typed-text is what the keystroke caption renders, so only `type` marks pass it.
mark() {
  [ "$RECORD" = "1" ] || return 0
  local t=$(( $(now_ms) - T0 ))
  local sep=""
  [ -n "$ACTIONS" ] && sep=","
  local text=""
  # Quotes and backslashes would break the JSON; the caption reads better without them.
  [ -n "${5:-}" ] && text=",\"text\":\"$(printf '%s' "$5" | tr -d '\\"')\""
  ACTIONS="${ACTIONS}${sep}{\"t\":${t},\"kind\":\"$1\",\"x\":$2,\"y\":$3,\"label\":\"${4:-}\"${text}}"
}

# Centre of an element, in viewport pixels. Takes a CSS selector, not an @ref —
# refs are not addressable here (and they go stale anyway).
centre() {
  ab get box "$1" 2>/dev/null | python -c "
import json,sys
b=json.load(sys.stdin)
print(round(b['x']+b['width']/2), round(b['y']+b['height']/2))
" 2>/dev/null || echo "640 360"
}

# Beat between visible actions. Generous on purpose: the recording has no mouse
# cursor, so the viewer needs time to read each state change.
beat() { ab wait "${1:-900}" >/dev/null 2>&1; }

# tap <css> [label] — click it, and log it so the camera zooms in on it
tap() {
  local xy; xy=$(centre "$1")
  ab scrollintoview "$1" >/dev/null 2>&1
  mark click ${xy} "${2:-$1}"
  ab click "$1" >/dev/null 2>&1
  beat 1000
}

# say <css> <text> [label] — type into it. The text is logged, so the render draws it
# as a keystroke caption that types itself out at ~20 chars/sec, and holds the zoom
# for the whole burst. `ab fill` is instant, so we wait out the caption ourselves —
# otherwise the recording ends mid-caption and the render has no footage to show it over.
say() {
  local xy; xy=$(centre "$1")
  mark type ${xy} "${3:-$1}" "$2"
  ab fill "$1" "$2" >/dev/null 2>&1
  beat $(( ${#2} * 50 + 1400 ))          # matches captionDurationMs() + a beat
}

# go <path> [label] — navigate. Logged as nav, which the zoom pass deliberately
# does NOT zoom: a navigation's payoff is the whole new screen.
go() {
  mark nav 640 360 "${2:-$1}"
  ab open "${BASE}$1" >/dev/null 2>&1
  ab wait --load networkidle >/dev/null 2>&1
  hide_overlays                            # a full page load remounts them
  beat 1200
}

# Dev overlays are THREE nodes, all on <html> not <body>: #react-scan-root (toolbar),
# a bare html > canvas (the component outlines/labels — the one that ruins a take),
# and [data-agentation-root]. All carry inline styles, so kill them inline.
hide_overlays() {
  ab eval "const kill=(el)=>{if(el)el.style.setProperty('display','none','important')};kill(document.getElementById('react-scan-root'));document.documentElement.querySelectorAll(':scope > canvas').forEach(kill);document.querySelectorAll('[data-agentation-root]').forEach(kill);'hidden'" >/dev/null 2>&1
}

# --- pre-roll: everything the viewer must NOT see -----------------------------
ab set viewport 1280 720 >/dev/null 2>&1
ab set media dark >/dev/null 2>&1
ab open "${BASE}${REPO}/quick-tasks" >/dev/null 2>&1     # ← opening shot
ab wait --load networkidle >/dev/null 2>&1
ab wait 2500 >/dev/null 2>&1
hide_overlays

# --- recording ----------------------------------------------------------------
finish() {
  [ "$RECORD" = "1" ] || return 0
  timeout 60 agent-browser record stop >/dev/null 2>&1 || true
  printf '{"slug":"%s","actions":[%s]}\n' "$SLUG" "$ACTIONS" > "$LOG"
}

if [ "$RECORD" = "1" ]; then
  trap finish EXIT                        # a failed step still saves the partial take
  ab record start "$OUT" >/dev/null 2>&1
  T0=$(now_ms)
  beat 1200                               # hold the opening shot
fi

# --- FLOW: 3–5 steps, start state → actions → payoff -------------------------
# Selectors: read them off `ab snapshot -i` while writing this, then use the
# aria-label / role text as a CSS selector. Prefer stable attributes.
#
#   tap '[aria-label="Search"]' "open search"
#   say 'input[placeholder="Task title"]' "Add a dark mode toggle" "type the task"
#   tap 'button:has-text("Create Task")' "create it"
#   go  "${REPO}/sessions" "land on the session"

# ...your steps here...

beat 1800                                  # hold the payoff state — the loop point
# -----------------------------------------------------------------------------

if [ "$RECORD" = "1" ]; then
  finish
  trap - EXIT
  echo "saved: $OUT"
  echo "log:   $LOG"
  echo "next:  cd video && node scripts/render-screencast.mjs $SLUG"
else
  echo "dry run OK — rerun with RECORD=1"
fi
