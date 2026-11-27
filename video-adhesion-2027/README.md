# Vidéos « Adhésion 2027 » de l'AFES

Document de travail du GT Communication (novembre 2026). Quatre courtes vidéos pour la campagne d'adhésion 2027, au format LinkedIn (1080 × 1350, 4:5), réutilisables plusieurs fois dans l'année : aucune n'annonce de date limite.

## Les quatre versions

| Version | Public | Voix off (ElevenLabs) | Durée | Ce qu'elle met en avant |
|---|---|---|---|---|
| `generale` | Tous publics | Koraly | 42 s | L'AFES, société savante depuis 1934 ; ce que l'adhésion apporte (IUSS, Lettre, tarifs JES) ; ce qu'elle fait vivre pour tous (revue EGS en accès libre, webinaires, bourses Demolon) |
| `etudiants` | Étudiant·es, doctorant·es, jeunes chercheur·ses | Lisa | 29 s | Bourses Demolon, IUSS, tarif réduit aux JES pour rencontrer la discipline, 18 € par an |
| `professionnels` | Pédologues, chargé·es d'études, conseiller·es, technicien·nes | Nicolas | 34 s | Reconnaissance des compétences en pédologie (réservée aux adhérent·es), PromoSolsTerrain, e-Sol, webinaires ; adhésion des structures |
| `fin-de-carriere` | Fin de carrière et retraite | Fabien | 35 s | Garder le lien (webinaires, EGS, Lettre) et transmettre (relecture, sorties de terrain, partage d'expérience) ; soutien aux bourses Demolon |

Fichiers produits dans `out/<version>/` : la vidéo (`AFES_adhesion2027_<version>_4x5.mp4`, son mixé à −14 LUFS), une miniature (`miniature_4x5.png`, à téléverser comme vignette sur LinkedIn) et les sous-titres (`sous-titres.srt`). Les sous-titres sont aussi incrustés dans l'image, sur l'horizon de surface, pour la lecture sans le son. Les textes de post proposés sont dans `textes-posts.md`.

## Parti pris

- **Orientation** : l'étude et la connaissance des sols, pas leur défense. L'accroche décrit le travail (« Un sol, ça se décrit, ça se mesure, ça se cartographie… et ça s'enseigne ») et les quatre versions finissent sur la même signature : **« Adhésion 2027 : comprendre les sols, ensemble. »**
- **Contenus** : repris de la page « Adhérer » d'afes.fr et du plan d'action Adhésions-Bénévoles-Ambassadeurs 2026-2027 (v1, juillet 2026), section 4 « Ce que vous recevez, ce que vous faites vivre ». La Journée mondiale des sols n'apparaît plus dans la version générale pour laisser la place aux activités scientifiques.
- **Identité visuelle** : celle des maquettes du site (Livvic et Open Sans, brun #5F3114, ocre #BF6525, vert #237D3D, fond crème), logo AFES, logos EGS, e-Sol et JES du rapport d'activité, photos d'afes.fr.
- **Sol** : horizons simples aux couleurs du logo EGS, séparés par la vaguelette AFES (même tracé que `assets/vague-ocre.svg` : arcs reliés par des diagonales), qui glisse lentement. Pas de racines ni d'agrégats.
- **Musique** : morceau instrumental généré avec ElevenLabs Music (`audio/music_a.mp3`), atténué sous la voix. Une alternative plus calme est disponible (`audio/music_b.mp3`).

## À vérifier avant publication

1. **Tarifs 2027** : « 18 € par an » (étudiant·es, demandeur·ses d'emploi) et « tarif réduit pour les salarié·es d'une structure adhérente » reprennent les tarifs 2026. La version étudiante dit « 18 € » à l'oral : si le tarif change, il faut régénérer la voix.
2. **Bourses Demolon** : la version étudiante les présente comme un avantage de l'adhésion (section 4 du plan d'action). Les conditions exactes d'accès sont à confirmer.
3. **Version fin de carrière** : « relire des articles » et « accompagner une sortie de terrain » sont des façons de contribuer, pas des dispositifs formalisés. À valider avec la revue EGS et les responsables de PromoSolsTerrain.
4. **Écoute** : prononciation de « AFES » (écrit « Afès » pour la synthèse vocale) et ton de chaque voix.
5. **Droits** : usage commercial de la musique ElevenLabs selon l'abonnement ; photos reprises d'afes.fr (personnes reconnaissables sur `p-demolon.png`, `actu-jes.jpg`, `missions.jpg`).
6. **Lien** : la vidéo renvoie à « afes.fr › Adhérer » ; le lien HelloAsso 2027 est à mettre dans le texte du post.

## Modifier ou refaire une vidéo

Le contenu de chaque version est décrit dans `versions.json` : scènes, textes affichés, sous-titres et mot de la voix off qui déclenche chaque apparition (`"at": "bourses-0.2"` = 0,2 s avant le mot « bourses »).

- Changer un texte affiché : modifier `versions.json`, puis `./make_all.sh <version>`.
- Changer la voix off : générer le nouveau texte dans ElevenLabs (flow « AFES – vidéo adhésion 2027 »), enregistrer l'audio dans `audio/vo_<version>.mp3` et l'horodatage mot à mot (transcription Scribe) dans `data/words_<version>.json`, mettre à jour `captions` dans `versions.json`, puis `./make_all.sh <version>`.
- Prévisualiser dans un navigateur : `composition.html?v=generale&play=1` (sans le son), ou `&t=12.5` pour un instant précis.

Outils nécessaires : Node.js avec Playwright (Chromium), Python 3 avec NumPy, ffmpeg. Chaque version se rend en 1 à 2 minutes.

## Autres formats

- **Instagram Reels, YouTube Shorts (9:16)** : `FORMAT=9x16 ./make_all.sh`. La mise en page s'adapte, mais les sous-titres incrustés tombent dans la zone recouverte par l'interface d'Instagram en bas d'écran : à remonter avant publication.
- **Carré (1:1)** : `FORMAT=1x1 ./make_all.sh`, à vérifier image par image (moins de hauteur disponible).
- **YouTube (16:9)** : demande une mise en page en colonnes, pas encore faite.

## Fichiers

- `versions.json` : contenu des quatre versions.
- `composition.html` : l'animation (une page web pilotée image par image).
- `build_timeline.py` : cale les scènes et les sous-titres sur l'horodatage de la voix.
- `render.js` : capture les images et encode la vidéo muette.
- `mix.sh` : ajoute la voix et la musique.
- `make_all.sh` : enchaîne le tout pour une ou plusieurs versions.
- `assets/`, `audio/`, `data/` : images, sons et chronologies.
