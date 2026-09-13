# 03 — Configuration des quiz et paramètres

Référence : `BESOIN.md`, §2.4 et §2.6 ; arbitrages complémentaires du 13 septembre 2026.

## Paramètres

**PAR-01 — Valeurs initiales.** Au premier lancement, le nombre de questions par
défaut vaut 10 et l'auto-évaluation est désactivée.

**PAR-02 — Gestionnaire.** Hors quiz, l'utilisateur peut modifier ces deux
préférences. Le nombre par défaut doit être un entier strictement positif.
L'enregistrement de valeurs invalides est bloqué avec un message au niveau du champ.
Annuler ferme le gestionnaire sans appliquer les modifications.

**PAR-03 — Persistance.** Les préférences sont conservées dans le `localStorage`
du navigateur pour la même origine. Elles ne sont pas écrites dans les cours.
Si ce stockage est indisponible, les valeurs restent applicables à la visite
courante et un message indique qu'elles ne seront pas conservées.
Des paramètres stockés invalides sont remplacés par les valeurs initiales avec
une information explicite.

**PAR-04 — Portée.** Une nouvelle configuration reprend les préférences enregistrées.
Modifier ponctuellement le nombre de questions sur l'écran de lancement ne change
pas la préférence enregistrée. Aucun cours sélectionné, quiz, bilan ou score
n'est conservé après rechargement.

## Préparation et lancement

**CFG-01 — Sélection multiple.** Un ou plusieurs cours valides peuvent être cochés.
Le nombre disponible est la somme de leurs questions. Sans sélection, le lancement
est désactivé et l'interface invite à choisir au moins un cours.

**CFG-02 — Quantité.** Le champ de quantité demandée accepte un entier strictement
positif. Vide, zéro, nombre négatif, décimal ou valeur non numérique empêchent
le lancement et produisent un message explicite.

**CFG-03 — Ajustement au stock.** Pour une demande `D` et un stock `S`, le quiz
contient `N = min(D, S)` questions. Si `D > S`, l'écran affiche avant lancement :
« Seulement S questions disponibles : le quiz portera sur S questions. »
Cet ajustement ne modifie pas la préférence enregistrée.

**CFG-04 — Tirage.** Au lancement, `N` entrées distinctes sont tirées aléatoirement
dans l'ensemble des cours sélectionnés, puis présentées dans un ordre aléatoire.
Chaque entrée a la même probabilité d'être sélectionnée ; aucun quota par cours
n'est appliqué. Un cours sélectionné peut donc ne pas être représenté dans un petit
quiz. Si `N = S`, toutes les entrées apparaissent, dans un ordre aléatoire.

**CFG-05 — Absence de répétition.** Une même entrée ne peut figurer deux fois dans
un quiz. Cette garantie ne supprime pas les textes identiques présents dans des
entrées différentes. Un nouveau quiz peut reprendre des questions déjà vues :
aucun historique ne restreint le tirage.

**CFG-06 — Configuration figée.** Au lancement, les questions, leur contenu,
leur ordre et l'activation de l'auto-évaluation sont figés jusqu'à la fin ou l'abandon.
Naviguer entre les questions ne déclenche jamais un nouveau tirage.
La sélection des cours, les imports et les paramètres ne sont modifiables qu'après
retour à l'accueil.

**CFG-07 — Informations préalables.** Avant « Lancer le quiz », l'écran présente
les cours sélectionnés, le stock disponible, la quantité effective et l'état de
l'auto-évaluation. Aucun filtre par difficulté, thème ou tags n'est proposé en V1.

## Critères d'acceptation

| ID | Situation / action | Résultat attendu |
|---|---|---|
| AC-PAR-01 | Première visite | Nombre 10, auto-évaluation désactivée |
| AC-PAR-02 | Enregistrement de 15 et auto-évaluation active, puis rechargement | Préférences retrouvées, aucun cours ni quiz restauré |
| AC-PAR-03 | Stockage navigateur indisponible | Préférences appliquées en mémoire ; non-persistance annoncée |
| AC-PAR-04 | Nombre par défaut 10, demande ponctuelle 4 | Quiz de 4 ; préférence toujours 10 |
| AC-CFG-01 | Aucun cours sélectionné | Lancement impossible |
| AC-CFG-02 | Deux cours de 6 et 9 questions sélectionnés | Stock affiché : 15 |
| AC-CFG-03 | Demande 10 avec 7 disponibles | Information préalable ; quiz de 7 |
| AC-CFG-04 | Quantité vide, 0, -1 ou 2,5 | Erreur et lancement bloqué |
| AC-CFG-05 | Tirage de 8 parmi 15 | Exactement 8 identités distinctes, issues seulement des cours sélectionnés |
| AC-CFG-06 | Tirage de tout le stock | Toutes les identités présentes une fois, ordre mélangé |
| AC-CFG-07 | Navigation aller-retour | Questions et ordre inchangés |
