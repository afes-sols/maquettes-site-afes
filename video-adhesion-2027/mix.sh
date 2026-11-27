#!/usr/bin/env bash
# Assemble la vidéo muette, la voix off et la musique.
# Usage : ./mix.sh <video_muette.mp4> <voix> <musique.mp3> <sortie.mp4>
# La voix est décalée de VO_OFFSET (voir build_timeline.py) ; la musique est
# atténuée sous la voix (compression déclenchée par la voix) puis fondue en fin.
set -euo pipefail
VIDEO=$1; VOICE=$2; MUSIC=$3; OUT=$4
DIR=$(cd "$(dirname "$0")" && pwd)
OFF_MS=$(python3 -c "import re;print(int(float(re.search(r'\"vo_offset\": ([0-9.]+)',open('$DIR/data/timeline_$VOICE.js').read()).group(1))*1000))")
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
FADE_ST=$(python3 -c "print(max(0,$DUR-2.6))")
ffmpeg -y -v error -i "$VIDEO" -i "$DIR/audio/vo_$VOICE.mp3" -i "$MUSIC" -filter_complex "
[1:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${OFF_MS}|${OFF_MS},apad,atrim=0:$DUR,asplit=2[vo][key];
[2:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:$DUR,asetpts=PTS-STARTPTS,volume=0.22,afade=t=in:d=0.25,afade=t=out:st=$FADE_ST:d=2.6[mus];
[mus][key]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=450:makeup=1[duck];
[vo][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"
echo "$OUT"
