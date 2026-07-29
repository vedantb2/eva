#!/usr/bin/env bash
# Convert a recorded webm to an X-ready mp4 (h264 / yuv420p / faststart, silent).
#   usage: to-mp4.sh <slug> [crf]
# Reads recordings/<slug>.webm, writes recordings/<slug>.mp4.
# Uses Remotion's bundled ffmpeg — no system ffmpeg needed.
set -eu
REC="C:/Vedant/Personal/GitHub/eva/recordings"
VIDEO_DIR="C:/Vedant/Personal/GitHub/eva/video"
slug="$1"; crf="${2:-20}"
src="${REC}/${slug}.webm"; out="${REC}/${slug}.mp4"

[ -f "$src" ] || { echo "no such recording: $src" >&2; exit 1; }

cd "$VIDEO_DIR"
# -an: X accepts a silent video, and a screencast has nothing to hear.
# -r 30: normalise the 25fps capture. yuv420p + faststart are X requirements.
npx remotion ffmpeg -y -i "$src" \
  -c:v libx264 -preset slow -crf "$crf" -pix_fmt yuv420p -r 30 \
  -movflags +faststart -an "$out" 2>&1 | tail -3

node scripts/check-audio.mjs "$out"
