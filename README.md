# Maquettes d'évolution du site de l'AFES

Document de travail du GT Communication de l'AFES (novembre 2026). Ces pages sont des **maquettes**, pas le site officiel (https://www.afes.fr).

Consultation : https://afes-sols.github.io/maquettes-site-afes/

- 6 sujets : menu haut, page d'accueil, pages intérieures, espace Formations, page Projets, espace adhérent ;
- pour chaque sujet, la version actuelle en référence et plusieurs options ;
- les maquettes s'affichent comme le site final ; en bas à gauche, « Montrer les nouveautés » entoure les ajouts en pointillés verts et « Page actuelle ↗ » ouvre la page correspondante sur afes.fr ;
- les menus, filtres, profils et onglets sont cliquables.

Les maquettes sont conçues sur un canevas Claude, puis exportées en HTML ; `dc-lite.js` est le petit moteur qui les rend interactives sans outil supplémentaire. Logo, photos et textes proviennent du site de l'AFES.

## Le site complet (`clone/`)

https://afes-sols.github.io/maquettes-site-afes/clone/

Les 148 pages et 156 actualités d'afes.fr, reconstruites avec une sélection des options : méga-menu (M2), accueil C avec chiffres clés en tuiles, menu latéral D sur toutes les pages intérieures, liens manquants de la cartographie (« Pour aller plus loin »), actualités filtrables et reliées à leur projet, catalogue Se former, page Projets, espace adhérent (EA2), recherche dans tout le site et plan du site. Les photos restent servies par afes.fr.

Le clone est généré par `_source/clone/build_clone.py` (dossier source hors dépôt, voir son LISEZ-MOI) : ne pas modifier `clone/` à la main.

## Vidéos « Adhésion 2027 » (`video-adhesion-2027/`)

Quatre vidéos courtes pour la campagne d'adhésion 2027 (version générale, étudiant·es, professionnel·les, fin de carrière), au format LinkedIn, avec la même identité visuelle que les maquettes. Mode d'emploi et points à vérifier : `video-adhesion-2027/README.md`.
