# 01 — Gestion des cours

Référence : `BESOIN.md`, §2.1 et §2.6.

## Chargement et catalogue

**COU-01 — Accueil vide.** Au démarrage, tant qu'aucun cours n'est chargé,
l'application propose « Choisir un répertoire » si disponible et « Importer des
fichiers JSON ». Le lancement d'un quiz est impossible.

**COU-02 — Choix du répertoire.** Le répertoire appartient à l'utilisateur ; `/cours`
n'est qu'un exemple, pas un chemin imposé. L'accès exige son intervention et les
autorisations du navigateur. La disponibilité dépend du navigateur et du contexte
d'exécution autorisé, pas seulement de son nom. Une nouvelle autorisation peut être
nécessaire ; Memio ne promet pas un accès permanent.

**COU-03 — Lecture.** Memio lit uniquement les fichiers dont l'extension est `.json`
(sans distinction de casse), directement présents dans le répertoire choisi.
Les autres fichiers et sous-répertoires sont ignorés. Chaque JSON est validé selon
[le contrat de données](02-format-et-generation.md).

**COU-04 — Résultat partiel.** Un fichier invalide ou illisible n'empêche pas le
chargement des autres. Un compte rendu indique les fichiers acceptés et ceux rejetés,
avec le motif de chaque rejet. Aucun cours partiellement valide n'est chargé.
Un répertoire sans cours valide produit un état vide explicite.

**COU-05 — Catalogue.** Chaque cours présente son nom, sa description, son nombre
de questions, son fichier d'origine et une case de sélection. Le catalogue est
trié par nom de cours puis par nom de fichier. Deux fichiers de noms différents
peuvent porter le même nom de cours ; leur origine permet de les distinguer.

**COU-06 — Actualisation.** « Actualiser » relit le répertoire sur demande, hors
quiz. Les fichiers supprimés ou devenus invalides disparaissent du catalogue.
La sélection des cours est réinitialisée et l'utilisateur en est informé.
En cas d'échec global de lecture, le catalogue précédent est conservé avec un
avertissement indiquant qu'il n'a pas été actualisé.

**COU-07 — Changement de source.** Choisir un autre répertoire remplace le catalogue
après confirmation si des cours sont déjà chargés. Une annulation ou un échec global
de lecture conserve le catalogue existant. Les cours chargés uniquement en mémoire
seront perdus lors du remplacement ; la confirmation le précise.

## Import et conservation

**COU-08 — Import manuel.** Le formulaire accepte un ou plusieurs fichiers JSON.
Chaque fichier est validé indépendamment. Les fichiers valides sont ajoutés au
catalogue ; les rejets sont détaillés sans annuler les autres imports.
Le collage direct de JSON dans un éditeur n'est pas prévu.

**COU-09 — Identité et conflits.** Le nom complet du fichier identifie un cours
dans le catalogue courant. Un import dont le nom existe déjà est refusé, sans
remplacement ni fusion. L'utilisateur doit renommer son fichier ou actualiser le
répertoire pour relire un fichier modifié sur disque. Une écriture vérifie également
l'absence du nom sur disque et ne doit pas écraser un fichier préexistant.

**COU-10 — Enregistrement dans le répertoire.** Avec un répertoire actif, un fichier
importé valide est enregistré dans celui-ci si l'utilisateur accorde l'écriture.
La réussite n'est annoncée qu'après l'enregistrement. Si l'écriture échoue ou est
refusée, le cours reste utilisable en mémoire avec l'état explicite
« Non enregistré dans le répertoire » et une action de téléchargement.

**COU-11 — Mode manuel.** Sans accès répertoire, les fichiers importés sont chargés
en mémoire ; Memio ne modifie pas les fichiers d'origine. Chaque cours peut être
téléchargé en JSON conforme. L'utilisateur choisit lui-même où le conserver avec
les fonctions du navigateur. Memio indique « Téléchargement demandé », sans affirmer
que le fichier a été enregistré dans un répertoire précis.

**COU-12 — Compatibilité et refus.** Le mode manuel est toujours accessible, y
compris après un refus d'accès au répertoire. Si la fonction répertoire est
indisponible, l'interface explique le repli et la compatibilité optimale avec les
versions compatibles de Chrome/Edge. Aucune permission n'est demandée au démarrage
sans action de l'utilisateur.

**COU-13 — Durée de vie.** Aucun cours ni accès répertoire n'est restauré
automatiquement après rechargement ou fermeture. L'utilisateur recharge sa source.
Les fichiers déjà enregistrés sur disque restent présents. L'interface avertit que
les cours uniquement en mémoire doivent être conservés manuellement avant de quitter.
Les opérations de catalogue ne sont pas accessibles pendant un quiz.

## Critères d'acceptation

| ID | Situation / action | Résultat attendu |
|---|---|---|
| AC-COU-01 | Répertoire avec deux JSON valides, un invalide et un PDF | Deux cours chargés ; rejet du JSON expliqué ; PDF ignoré |
| AC-COU-02 | Répertoire vide ou sans JSON valide | État vide ; lancement impossible |
| AC-COU-03 | Annulation du sélecteur | Aucun changement de catalogue, aucune erreur |
| AC-COU-04 | API indisponible ou permission refusée | Import manuel utilisable et explication visible |
| AC-COU-05 | Import valide avec écriture autorisée | Fichier présent dans le répertoire, cours disponible |
| AC-COU-06 | Échec d'écriture après import valide | Cours utilisable, état non enregistré, téléchargement proposé |
| AC-COU-07 | Import d'un nom de fichier déjà présent | Refus explicite ; fichier et cours existants inchangés |
| AC-COU-08 | Deux fichiers différents avec le même nom de cours | Deux entrées distinguées par leur fichier |
| AC-COU-09 | Rechargement de la page | Catalogue vide ; fichiers sur disque non supprimés |
| AC-COU-10 | Actualisation après suppression d'un fichier | Cours retiré ; sélection réinitialisée et notification |
