# Spécifications fonctionnelles — Memio

## Objet et références

Ces documents décrivent la première version de Memio, une application de révision
pour étudiants, réalisée en HTML, CSS et JavaScript sans backend applicatif.
Ils constituent une base pour le développement et la recette.

Source : [expression de besoin](../../BESOIN.md).
Les arbitrages recueillis le 13 septembre 2026 complètent cette expression.
Aucune implémentation de l'application n'est incluse dans ces documents.

## Organisation

| Document | Contenu |
|---|---|
| [01 — Gestion des cours](01-gestion-des-cours.md) | Répertoire, catalogue, import, export et erreurs |
| [02 — Format et génération](02-format-et-generation.md) | Contrat JSON, validation et prompt IA |
| [03 — Configuration](03-configuration.md) | Sélection des cours, tirage et paramètres |
| [04 — Quiz et bilan](04-quiz-et-bilan.md) | Navigation, révélation, auto-évaluation et fin |

Chaque règle possède un identifiant stable. Les critères d'acceptation de chaque
document précisent les résultats observables attendus.

## Décisions validées

| Sujet | Décision |
|---|---|
| Architecture | Application entièrement exécutée dans le navigateur ; aucun appel à une IA |
| Accès disque | Sélection explicite d'un répertoire via File System Access API si disponible ; repli import/export manuel |
| Compatibilité | Information sur la compatibilité optimale avec Chrome/Edge compatibles |
| Format | Un fichier JSON par cours ; tous les champs décrits sont obligatoires |
| Prompt | Visible et copiable dans une modale ; texte définitif à rédiger pendant le développement |
| Sélection | Un ou plusieurs cours par quiz |
| Tirage | Aléatoire, sans répétition dans un même quiz, questions des cours sélectionnés mélangées |
| Quantité | 10 par défaut ; si la demande dépasse le stock, utiliser tout le stock et informer l'utilisateur |
| Auto-évaluation | Facultative, désactivée par défaut |
| Score | Réponses déclarées correctes / questions évaluées ; non-évaluées comptées séparément |
| Fin anticipée | Possible ; confirmation si le quiz est incomplet |
| Persistance | Paramètres uniquement côté navigateur ; ni reprise de quiz ni historique des scores |
| Ouverture directe | `index.html` doit rester utilisable en double-clic (`file://`), en plus d'un hébergement statique |
| Implémentation | Scripts JavaScript classiques (sans modules ES ni `fetch`), aucun framework ni étape de compilation |
| Outillage de test | Tests unitaires `node:test` sur le domaine/les services ; parcours Playwright multi-navigateurs |

Ces trois dernières lignes ont été confirmées le 13 septembre 2026, lors de la
préparation du plan de développement ; voir aussi le [README](../../README.md) du projet.

Ces arbitrages remplacent, pour cette version, la sélection d'un seul cours décrite
au §2.4 du besoin et les mentions « optionnel » des champs JSON au §2.2.

## Conventions de spécification

Les précisions suivantes rendent le fonctionnement déterministe. Elles sont des
conventions proposées dans ces spécifications, et non des décisions explicitement
recueillies auprès de l'utilisateur :

- Lecture des fichiers JSON à la racine du répertoire choisi, sans sous-répertoires.
- Tirage uniforme dans l'ensemble des questions, sans quota par cours.
- Pas de remplacement ni de suppression d'un fichier existant depuis Memio en V1.
- Textes JSON non vides et au moins un tag par question.
- Réponse déjà révélée conservée visible lors d'un retour sur une question.
- Paramètres modifiables hors quiz ; configuration figée pendant un quiz.

## Parcours nominal

1. L'étudiant ouvre Memio et charge des cours depuis un répertoire ou des fichiers.
2. Si nécessaire, il ouvre la modale du prompt, le copie et génère un fichier auprès d'une IA externe.
3. Il importe le fichier JSON obtenu ; Memio le valide avant de le rendre utilisable.
4. Il sélectionne un ou plusieurs cours, choisit la quantité et configure l'auto-évaluation.
5. Il lance le quiz, consulte les questions et révèle les réponses à son rythme.
6. Il s'auto-évalue s'il a activé cette option, puis consulte le bilan.

## Surfaces fonctionnelles

| Surface | Éléments attendus |
|---|---|
| Accueil / catalogue | Chargement du répertoire, import de fichiers, liste des cours, sélection multiple, export, accès au prompt et aux paramètres |
| Configuration | Nombre demandé, nombre disponible, nombre effectif, lancement |
| Modale du prompt | Instructions d'utilisation externe, prompt sélectionnable, copie, fermeture |
| Paramètres | Nombre par défaut, activation de l'auto-évaluation, enregistrement |
| Quiz | Cours d'origine, position, question, réponse masquée, révélation, navigation, évaluation éventuelle, fin et abandon |
| Bilan | Progression, questions et réponses, évaluations éventuelles, score conditionnel, retour à l'accueil |

## Exigences transversales

**GEN-01 — Confidentialité.** Les fichiers et réponses restent dans le navigateur
et sur le disque choisi. Memio ne transmet pas les cours à un service externe.
La copie du prompt ne copie aucun contenu de cours automatiquement.

**GEN-02 — Affichage.** L'interface est en français, utilisable sur ordinateur et
mobile. Les commandes essentielles restent accessibles sans débordement horizontal.
Les libellés, états et erreurs ne reposent pas uniquement sur une couleur.

**GEN-03 — Accessibilité.** Les commandes sont accessibles au clavier, les champs
ont un libellé et le focus est visible. Les modales retiennent le focus pendant leur
ouverture et le rendent au déclencheur à la fermeture. Une modale non destructive
peut être fermée avec Échap.

**GEN-04 — Erreurs.** Une erreur indique l'opération concernée, sa cause connue et
l'action possible. Une annulation de sélecteur de fichiers n'est pas une erreur.
Aucun message de réussite n'est affiché avant la réussite réelle de l'opération.

**GEN-05 — Contenu non fiable.** Les textes importés sont affichés comme du texte,
jamais exécutés comme du HTML ou du JavaScript. Le rendu Markdown, les médias et
le rendu de formules mathématiques spécialisées ne font pas partie de la V1.

**GEN-06 — Chargement.** Pendant une lecture ou un enregistrement, un indicateur
d'activité est visible et les commandes susceptibles de déclencher la même opération
en double sont désactivées.

## Hors périmètre

Comptes, backend, base de données, synchronisation cloud, génération IA intégrée,
correction automatique de réponses saisies, QCM, répétition espacée, historique,
reprise après rechargement, édition ou suppression des cours, filtres par thème,
difficulté ou tags et répartition équilibrée entre cours.

## Critères d'acceptation transversaux

| ID | Situation | Résultat attendu |
|---|---|---|
| AC-GEN-01 | Parcours complet au clavier | Chargement, configuration, quiz et bilan accessibles ; focus visible |
| AC-GEN-02 | Ouverture puis fermeture du prompt | Focus dans la modale puis rendu au bouton d'ouverture |
| AC-GEN-03 | Consultation sur petit écran | Textes lisibles et commandes essentielles utilisables |
| AC-GEN-04 | Import contenant une balise HTML dans une question | Balise affichée comme texte ; aucun code exécuté |
| AC-GEN-05 | Utilisation de Memio | Aucun envoi de cours ou appel à une IA par l'application |
