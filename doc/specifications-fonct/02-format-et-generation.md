# 02 — Format des cours et génération externe

Référence : `BESOIN.md`, §2.2, §2.3 et validations du §4.

## Contrat JSON

**DAT-01 — Structure.** Un fichier UTF-8 contient un unique objet JSON représentant
un cours. Tous les champs ci-dessous sont obligatoires. Les textes doivent contenir
au moins un caractère autre qu'un espace. `null` ne remplace aucune valeur.

| Emplacement | Champ | Type et contrainte |
|---|---|---|
| Racine | `cours` | Chaîne non vide |
| Racine | `description` | Chaîne non vide |
| Racine | `questions` | Tableau contenant au moins une question valide |
| Question | `question` | Chaîne non vide |
| Question | `reponse` | Chaîne non vide |
| Question | `explication` | Chaîne non vide |
| Question | `theme` | Chaîne non vide |
| Question | `difficulte` | Exactement `facile`, `moyen` ou `difficile` |
| Question | `tags` | Tableau d'au moins une chaîne non vide |

La chaîne `facile | moyen | difficile` du besoin décrit les possibilités :
elle n'est pas une valeur valide. Les propriétés supplémentaires sont tolérées,
ignorées par l'application et non garanties à l'export. Aucune conversion implicite
n'est faite : un nombre ne devient pas une chaîne et un tag isolé ne devient pas
automatiquement un tableau.

**DAT-02 — Validation atomique.** Toute question invalide entraîne le rejet du
fichier entier. Une erreur désigne le fichier et, lorsque le JSON est analysable,
le chemin du champ concerné, par exemple `questions[2].reponse` pour la troisième
question. Une erreur de syntaxe JSON doit être distinguée d'une erreur de structure.
Memio ne répare pas silencieusement le contenu généré.

**DAT-03 — Doublons.** Il n'y a pas de détection sémantique de questions équivalentes.
L'identité d'une question repose sur le fichier source et sa position dans le
tableau. Deux entrées au texte identique restent deux questions distinctes.
Le prompt doit demander d'éviter les doublons.

**DAT-04 — Export.** Le fichier téléchargé contient les champs reconnus ci-dessus,
avec leurs types et valeurs, pour toutes les questions du cours ; il ne contient
ni sélection de quiz ni score. Son contenu doit pouvoir être réimporté sans perte
des champs fonctionnels.

## Exemple conforme

```json
{
  "cours": "Biologie — La cellule",
  "description": "Révision des structures cellulaires.",
  "questions": [
    {
      "question": "Quel est le rôle principal de la membrane plasmique ?",
      "reponse": "Elle délimite la cellule et contrôle les échanges avec son environnement.",
      "explication": "Sa perméabilité sélective contribue au maintien du milieu intracellulaire.",
      "theme": "Structures cellulaires",
      "difficulte": "facile",
      "tags": ["cellule", "membrane"]
    }
  ]
}
```

## Modale du prompt

**IA-01 — Accès.** L'accueil propose « Voir / copier le prompt », même sans cours
chargé. La modale affiche le prompt complet et une marche à suivre : le copier,
le soumettre à une IA externe avec le cours, enregistrer le résultat dans un fichier
`.json`, puis importer ce fichier dans Memio.

**IA-02 — Limite de responsabilité.** La modale explique qu'aucun contenu n'est
envoyé par Memio. L'étudiant choisit ce qu'il transmet à l'outil externe et doit
relire les réponses : la validation JSON ne garantit pas leur exactitude pédagogique.
« Seul le prompt est visible » signifie que l'intégration IA se limite au prompt ;
cela n'interdit pas d'afficher les questions et réponses importées pendant le quiz.

**IA-03 — Copie.** « Copier le prompt » copie exactement le texte visible.
Une confirmation suit uniquement une copie réussie. Si le presse-papiers est
indisponible ou refuse l'accès, un message propose la sélection et la copie manuelle
du texte, qui reste accessible.

**IA-04 — Contenu attendu.** Le texte définitif sera rédigé pendant le développement.
Il doit demander à l'IA :

- De produire des questions et réponses en français, uniquement fondées sur le cours fourni.
- De couvrir ses notions importantes sans questions redondantes ni connaissances inventées.
- De fournir une explication pédagogique, un thème, une difficulté autorisée et des tags pour chaque question.
- De retourner un seul objet JSON conforme au contrat, avec tous les champs obligatoires.
- De ne mettre ni balises de bloc Markdown, ni commentaires, ni prose autour du JSON.
- D'échapper correctement guillemets et retours à la ligne dans les chaînes JSON.

Le prompt comprend un emplacement identifiable pour le cours source et pour la
quantité souhaitée lors de la génération. L'utilisateur les complète dans son outil
externe. Cette quantité constitue la taille du jeu de données, indépendamment du
nombre de questions configuré pour un quiz. Aucun formulaire de génération ni
appel externe automatique n'est requis dans Memio.

## Critères d'acceptation

| ID | Situation / action | Résultat attendu |
|---|---|---|
| AC-DAT-01 | Import de l'exemple ci-dessus | Cours accepté avec une question |
| AC-DAT-02 | Absence de `description`, `theme` ou `explication` | Rejet avec champ concerné malgré les anciennes mentions optionnelles |
| AC-DAT-03 | `questions` vide, `tags` vide, texte blanc ou champ à `null` | Rejet explicite |
| AC-DAT-04 | Difficulté `moyenne` ou chaîne des trois possibilités | Rejet ; valeurs autorisées indiquées |
| AC-DAT-05 | JSON entouré de balises Markdown | Rejet de syntaxe ; instruction de fournir uniquement le JSON |
| AC-DAT-06 | Une question invalide parmi dix | Aucun chargement partiel du fichier |
| AC-DAT-07 | Export puis réimport dans un catalogue vide | Champs fonctionnels et questions conservés |
| AC-IA-01 | Ouverture sans cours chargé | Prompt et instructions disponibles |
| AC-IA-02 | Copie réussie / refusée | Confirmation réelle / message et copie manuelle possible |
| AC-IA-03 | Lecture du prompt livré | Contrat, langue, fidélité au cours et sortie JSON seule explicités |
