#!/usr/bin/env bash
# Produit toutes les versions : chronologie, vidéo muette, mixage, miniature.
# Usage : ./make_all.sh [version ...]   (par défaut : toutes celles de versions.json)
# Formats : FORMAT=4x5 (1080×1350, défaut), 9x16 (1080×1920) ou 1x1 (1080×1080).
set -euo pipefail
cd "$(dirname "$0")"
FORMAT=${FORMAT:-4x5}
case $FORMAT in 4x5) W=1080; H=1350;; 9x16) W=1080; H=1920;; 1x1) W=1080; H=1080;; *) echo "format inconnu"; exit 1;; esac
MUSIC=${MUSIC:-audio/music_a.mp3}
VERSIONS=("$@")
[ ${#VERSIONS[@]} -eq 0 ] && mapfile -t VERSIONS < <(python3 -c "import json;print('\n'.join(k for k in json.load(open('versions.json')) if not k.startswith('_')))")
for V in "${VERSIONS[@]}"; do
  python3 build_timeline.py "$V"
  mkdir -p "out/$V"
  node render.js video "$V" $W $H "out/$V/_muet_$FORMAT.mp4"
  ./mix.sh "out/$V/_muet_$FORMAT.mp4" "$V" "$MUSIC" "out/$V/AFES_adhesion2027_${V}_$FORMAT.mp4"
  rm -f "out/$V/_muet_$FORMAT.mp4"
  T=$(python3 -c "import json,re;d=json.loads(re.sub(r'^window.TIMELINE = |;\s*$','',open('data/timeline_$V.js').read()));print(round(d['scenes'][1]['start']-0.15,2))")
  node render.js stills "$V" $W $H "out/$V/_still" "$T"
  mv "out/$V/_still/"*.png "out/$V/miniature_$FORMAT.png" && rmdir "out/$V/_still"
done
