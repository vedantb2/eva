#!/usr/bin/env bash
# Pull stills out of a recording so it can be QA'd without a video player.
#   usage: frames.sh <slug> <sec> [sec ...]
# Reads recordings/<slug>.webm (falls back to .mp4), writes
# recordings/frames/<slug>-<sec>s.png for each timestamp.
#
# Seeks per-frame rather than using -vf fps: Remotion's bundled ffmpeg is built
# --disable-filters, so most -vf expressions error out.
set -eu
REC="C:/Vedant/Personal/GitHub/eva/recordings"
VIDEO_DIR="C:/Vedant/Personal/GitHub/eva/video"
slug="$1"; shift

src="${REC}/${slug}.webm"
[ -f "$src" ] || src="${REC}/${slug}.mp4"
[ -f "$src" ] || { echo "no such recording: ${REC}/${slug}.{webm,mp4}" >&2; exit 1; }

mkdir -p "${REC}/frames"
cd "$VIDEO_DIR"
for t in "$@"; do
  out="${REC}/frames/${slug}-${t}s.png"
  npx remotion ffmpeg -y -ss "$t" -i "$src" -frames:v 1 "$out" >/dev/null 2>&1
  echo "$out"
done
