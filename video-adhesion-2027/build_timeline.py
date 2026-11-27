"""Prépare la chronologie d'une version de la vidéo à partir de sa voix off.

Entrées : versions.json (scènes et sous-titres de chaque version),
audio/vo_<version>.mp3 et data/words_<version>.json (horodatage mot à mot
renvoyé par la transcription ElevenLabs).
Sorties : data/timeline_<version>.js (lu par composition.html) et
out/<version>/sous-titres.srt (à téléverser avec la vidéo sur LinkedIn ou YouTube).

Usage : python3 build_timeline.py generale [etudiants ...]   (ou : all)
"""
import copy
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FPS = 30
VO_OFFSET = 0.45   # silence avant la première syllabe (s)
TAIL = 3.4         # durée du carton final après la dernière syllabe (s)

# Graphie affichée quand elle diffère de celle donnée à la synthèse vocale.
# « l'AFES » se prononce d'un seul mot, comme « la fesse » : la voix off l'écrit
# en alphabet phonétique (/lafɛs/), que le modèle eleven_v4 lit tel quel.
DISPLAY = {"/lafɛs/": "l'AFES", "l'Afès": "l'AFES", "L'Afès": "L'AFES"}


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.strip(".,:;…?!«»  ")


def load_words(version):
    data = json.loads((ROOT / "data" / f"words_{version}.json").read_text())
    out = []
    for w in data["words"]:
        txt = w["text"].strip()
        if w.get("type") != "word" or not norm(txt) or txt.startswith("["):
            continue
        for k, v in DISPLAY.items():
            txt = txt.replace(k, v)
        out.append({"text": txt, "start": round(w["start"] + VO_OFFSET, 3),
                    "end": round(w["end"] + VO_OFFSET, 3)})
    return out


ANCHOR = re.compile(r"^(.+?)(?:#(\d+|last))?([+-]\d+(?:\.\d+)?)?$")


def resolver(words):
    def resolve(spec):
        m = ANCHOR.match(spec.strip())
        if not m:
            raise ValueError(f"ancre illisible : {spec}")
        word, occ, off = m.group(1), m.group(2), float(m.group(3) or 0)
        hits = [w for w in words if norm(w["text"]) == norm(word)]
        if not hits:
            raise ValueError(f"mot introuvable dans la voix : {word!r}")
        w = hits[-1] if occ == "last" else hits[int(occ or 1) - 1]
        return round(w["start"] + off, 3)
    return resolve


def resolve_tree(node, resolve):
    """Ajoute 't' à chaque objet qui porte 'at' (et 'yearT' pour 'yearAt')."""
    if isinstance(node, dict):
        if "at" in node:
            node["t"] = resolve(node["at"])
        if "yearAt" in node:
            node["yearT"] = resolve(node["yearAt"])
        for v in node.values():
            resolve_tree(v, resolve)
    elif isinstance(node, list):
        for v in node:
            resolve_tree(v, resolve)


def tokens(line):
    out = []
    for tok in line.split(" "):
        if tok in (":", "?", "!", ";") and out:
            out[-1] += " " + tok   # espace fine insécable avant la ponctuation haute
        else:
            out.append(tok)
    return out


def captions(lines, words):
    caps, i = [], 0
    for line in lines:
        toks = tokens(line)
        ws = words[i:i + len(toks)]
        if len(ws) < len(toks):
            raise ValueError(f"sous-titres plus longs que la voix : {line!r}")
        for tok, w in zip(toks, ws):
            if norm(tok) != norm(w["text"]):
                raise ValueError(f"décalage sous-titres : {tok!r} / voix {w['text']!r} (ligne {line!r})")
        caps.append({"start": ws[0]["start"], "end": ws[-1]["end"],
                     "words": [{"t": tok, "s": w["start"], "e": w["end"]} for tok, w in zip(toks, ws)]})
        i += len(toks)
    if i != len(words):
        rest = " ".join(w["text"] for w in words[i:])
        raise ValueError(f"mots de la voix sans sous-titre : {rest}")
    for a, b in zip(caps, caps[1:]):
        a["hold"] = b["start"] if b["start"] - a["end"] < 0.8 else a["end"] + 0.4
    caps[-1]["hold"] = caps[-1]["end"] + 0.6
    return caps


def srt_time(s):
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"


def build(version, config):
    words = load_words(version)
    resolve = resolver(words)
    scenes = copy.deepcopy(config["scenes"])
    resolve_tree(scenes, resolve)
    for s in scenes:
        s["start"] = s["t"]
    vo_end = words[-1]["end"]
    duration = round(vo_end + TAIL, 3)
    caps = captions(config["captions"], words)
    timeline = {"version": version, "label": config["label"], "voice": config["voice"]["name"],
                "fps": FPS, "vo_offset": VO_OFFSET, "duration": duration, "vo_end": vo_end,
                "scenes": scenes, "captions": caps}
    (ROOT / "data" / f"timeline_{version}.js").write_text(
        "window.TIMELINE = " + json.dumps(timeline, ensure_ascii=False) + ";\n", encoding="utf-8")
    outdir = ROOT / "out" / version
    outdir.mkdir(parents=True, exist_ok=True)
    srt = []
    for i, cap in enumerate(caps, 1):
        text = " ".join(w["t"] for w in cap["words"])
        srt.append(f"{i}\n{srt_time(cap['start'])} --> {srt_time(cap['hold'])}\n{text}\n")
    (outdir / "sous-titres.srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"{version}: {duration:.2f} s, {len(scenes)} scènes, {len(caps)} sous-titres")
    for s in scenes:
        print(f"   {s['start']:6.2f}  {s['type']}")


def main():
    versions = json.loads((ROOT / "versions.json").read_text())
    versions = {k: v for k, v in versions.items() if not k.startswith("_")}
    names = sys.argv[1:] or ["generale"]
    if names == ["all"]:
        names = list(versions)
    for name in names:
        build(name, versions[name])


if __name__ == "__main__":
    main()
