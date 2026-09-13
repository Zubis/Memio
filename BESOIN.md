# Expression de besoin — Memio

## 1. Contexte et objectif

Memio est une application web destinée à aider des étudiants à réviser leurs cours sous
forme de quizz. L'application est développée en **HTML / CSS / JavaScript pur**, sans
backend, et fonctionne intégralement dans le navigateur.

Les jeux de questions/réponses ne sont **pas générés par l'application elle-même** :
ils sont produits par un outil d'IA générative externe (ex. ChatGPT, Claude, etc.) à
partir d'un **prompt fourni par l'application**. L'utilisateur copie ce prompt, le
soumet à l'IA de son choix avec le contenu de son cours, récupère la réponse (au format
défini ci-dessous) et l'importe dans Memio. Seul le **prompt** est visible et exposé
dans l'application ; aucun appel API vers un service d'IA n'est effectué par Memio.

## 2. Fonctionnalités attendues

### 2.1 Gestion des cours
- Les cours sont représentés par des **fichiers JSON** (un fichier = un cours), stockés
  dans un répertoire dédié (ex. `/cours`).
- L'application propose une **liste des cours disponibles**, construite à partir des
  fichiers JSON présents dans ce répertoire.
- Un **formulaire de chargement** permet à l'utilisateur d'ajouter/importer un nouveau
  fichier de cours (jeu de questions/réponses généré par l'IA) sans quitter
  l'application.

> **Contrainte technique et arbitrage** : une page HTML/CSS/JS pure ne peut ni lister
> automatiquement le contenu d'un répertoire, ni y écrire, sans intervention explicite
> de l'utilisateur (sécurité du navigateur) et sans backend.
> Pour rester 100% front tout en répondant au besoin :
> - Sur navigateurs compatibles (Chrome, Edge…), Memio utilise la **File System Access
>   API** (`showDirectoryPicker`) : l'utilisateur sélectionne une fois le répertoire
>   `/cours`, l'application peut alors lister les fichiers JSON qu'il contient et y
>   écrire les nouveaux cours importés (persistance réelle sur disque).
> - Sur les navigateurs non compatibles, l'application propose un **repli** en mode
>   import/export manuel : sélection de fichier(s) via `<input type="file">` pour
>   charger un cours, et téléchargement du fichier JSON pour l'enregistrer manuellement
>   dans le répertoire `/cours`.
> - Ce point technique devra être confirmé/validé avant l'implémentation.

### 2.2 Format du jeu de questions/réponses (fichier de cours)

Chaque fichier de cours est un JSON structuré comme suit :

```json
{
  "cours": "Nom du cours",
  "description": "Description courte du cours (optionnel)",
  "questions": [
    {
      "question": "Texte de la question",
      "reponse": "Texte de la réponse",
      "explication": "Explication complémentaire (optionnel)",
      "theme": "Chapitre ou thème abordé (optionnel)",
      "difficulte": "facile | moyen | difficile",
      "tags": ["mot-clé1", "mot-clé2"]
    }
  ]
}
```

Ce format sera **précisé explicitement dans le prompt** fourni à l'IA, afin que la
génération produise directement un JSON exploitable par Memio.

### 2.3 Prompt de génération
- Le prompt type (incluant la description du format JSON ci-dessus) est accessible
  depuis l'application via une **fenêtre modale** (ex. bouton « Voir / copier le
  prompt »).
- Un bouton permet de **copier le prompt** dans le presse-papiers.
- Le prompt n'est jamais envoyé automatiquement à un service d'IA depuis Memio.

### 2.4 Sélection et configuration du quizz
- L'utilisateur sélectionne un cours dans la liste.
- Il configure le nombre de questions du quizz (**valeur par défaut : 10**, modifiable).
- Il peut activer/désactiver, via un **gestionnaire de paramètres**, le mode
  **auto-évaluation** : si activé, après affichage de la réponse, l'utilisateur indique
  lui-même si sa réponse était correcte (pour calculer un score) ; si désactivé, le
  quizz se déroule sans suivi de score.
- (Optionnel/futur) Filtrage des questions par thème, difficulté ou tags.

### 2.5 Déroulement du quizz
- Navigation **libre** entre les questions (précédent / suivant / passer une question),
  et non strictement linéaire.
- Pour chaque question :
  1. La question est affichée seule.
  2. L'utilisateur déclenche l'affichage de la réponse (bouton « Afficher la
     réponse »), ainsi que l'explication complémentaire si elle existe.
  3. Si l'auto-évaluation est activée, l'utilisateur indique si sa réponse était juste
     ou fausse.
- En fin de quizz, un **récapitulatif** est affiché (score si auto-évaluation activée,
  liste des questions traitées).

### 2.6 Persistance
- Les cours (fichiers JSON) sont conservés sur disque, dans le répertoire dédié,
  via la File System Access API (ou via export/import manuel en repli).
- Les paramètres utilisateur (nombre de questions par défaut, activation de
  l'auto-évaluation, etc.) peuvent être conservés en `localStorage` du navigateur.

## 3. Hors périmètre (pour cette première version)
- Aucun appel direct à une API d'IA générative depuis l'application.
- Aucun backend serveur, aucune base de données.
- Pas de gestion multi-utilisateur / comptes / authentification.
- Pas de synchronisation cloud entre appareils.

## 4. Points à valider avant développement
- Confirmer le support de la File System Access API comme solution principale
  (limitée à Chrome/Edge/Chromium) et l'acceptabilité du mode de repli
  (import/export manuel) sur les autres navigateurs.
  - Oui, les utilisateurs seront informés de la compatibilité optimal avec ces navigateurs.
- Valider le contenu exact du prompt type et les libellés exacts des champs du format
  JSON avec l'utilisateur final.
  - Le format de sorti json est validé. La rédaction du prompt fera partie des éléments a developper en même temps que l'application
- Définir les règles de validation d'un fichier de cours importé (champs obligatoires,
  gestion des erreurs de format).
  - Tous les champs sont obligatoires et devront être fourni par le prompt d'origine
