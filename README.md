# Memio

Application statique de révision par quiz. Le contenu pédagogique (questions/réponses)
est produit par une IA générative **externe**, à partir d'un prompt fourni par Memio.
Memio ne réalise **aucun appel réseau externe** : les seuls chargements automatiques
servent les fichiers JSON publiés avec le site depuis le dossier `cours/`. Tout
s'exécute dans le navigateur.

Voir [`BESOIN.md`](BESOIN.md) pour l'expression de besoin et
[`doc/specifications-fonct/`](doc/specifications-fonct/) pour les spécifications
fonctionnelles détaillées (règles, critères d'acceptation).

## Démarrer l'application (utilisateur final)

Aucune installation n'est nécessaire pour **utiliser** Memio : c'est un site statique.

- **Hébergement statique HTTP** : servez le dossier du projet via n'importe quel
  serveur HTTP statique, en HTTPS ou sur `localhost`. Les cours déclarés dans
  `cours/index.json` apparaissent automatiquement dans le catalogue au démarrage.
  Cela active aussi, si votre navigateur le permet, la sélection d'un répertoire de
  cours avec lecture/écriture directe sur disque.
- **Ouverture directe** : l'ouverture en `file://` reste possible pour l'import et
  l'export manuels, mais elle ne charge pas automatiquement le catalogue embarqué.

Les fichiers `index.html`, `assets/` et `cours/` sont nécessaires à l'utilisation
avec catalogue préchargé ; `tests/`, `package.json` et les autres fichiers de
développement ne sont pas requis.

### Compatibilité

Memio fonctionne dans tout navigateur récent. La sélection d'un **répertoire** de
cours (et l'écriture automatique des fichiers importés dans ce répertoire) utilise la
*File System Access API*, disponible principalement dans les versions récentes de
**Chrome** et **Edge**. Si votre navigateur ne la propose pas, ou si vous ouvrez
Memio directement en `file://`, l'application bascule automatiquement sur un mode
**import / export manuel** (sélection de fichiers, téléchargement), toujours disponible,
et vous en informe explicitement. Le chargement automatique de `cours/index.json`
nécessite en revanche un accès HTTP au site.

Les préférences (nombre de questions par défaut, auto-évaluation) sont conservées dans
le `localStorage` du navigateur, quand celui-ci est disponible. Aucun cours, aucune
sélection ni aucun quiz en cours n'est restauré après rechargement de la page.

## Déploiement (GitHub Pages)

Le dépôt inclut un workflow GitHub Actions (`.github/workflows/deploy-pages.yml`) qui
publie automatiquement l'application sur GitHub Pages à chaque push sur `main`.

Pour l'activer sur votre propre dépôt GitHub :

1. Poussez ce dépôt sur GitHub (`git remote add origin <url>` puis `git push -u origin main`).
2. Dans les paramètres du dépôt GitHub, section **Settings → Pages**, choisissez la
   source **GitHub Actions** (aucune configuration supplémentaire requise : le
   workflow fourni s'en charge).
3. Le site est ensuite disponible à `https://<utilisateur>.github.io/<depot>/`.

Le workflow publie `index.html`, `assets/`, `cours/` et `.nojekyll` : les dossiers
de développement (`tests/`, `node_modules/`, etc.) ne sont pas déployés. Les cours
à précharger doivent être versionnés dans `cours/` et référencés dans
`cours/index.json`. L'hébergement en HTTPS active en plus, si le navigateur le
permet, la sélection directe d'un répertoire de cours (*File System Access API*).


## Utiliser Memio

1. **Charger des cours** : sur HTTP, les cours déclarés dans `cours/index.json`
  sont chargés automatiquement. Vous pouvez aussi importer un ou plusieurs fichiers
  `.json`, ou choisir un répertoire contenant vos cours si votre navigateur le permet.
2. **Générer un cours** (optionnel) : ouvrez « Voir / copier le prompt », copiez le
  texte, joignez le cours source et précisez au besoin le volume de questions,
  soumettez-le à l'IA générative de votre choix, enregistrez sa réponse dans un
  fichier `.json`, puis importez-le dans Memio.
   Memio ne transmet jamais votre cours à un service tiers : cette étape se déroule
   entièrement en dehors de l'application.
3. **Sélectionner** un ou plusieurs cours dans le catalogue, choisir le nombre de
   questions souhaité (ajusté automatiquement si le stock disponible est inférieur),
   puis « Lancer le quiz ».
4. **Réviser** : naviguez librement entre les questions, révélez la réponse à votre
   rythme, évaluez-vous si l'auto-évaluation est activée (paramètre à activer dans
   « Paramètres »), puis terminez le quiz pour consulter le bilan.

## Format des fichiers de cours

Un fichier `.json` par cours, avec tous les champs obligatoires. Voir
[`doc/specifications-fonct/02-format-et-generation.md`](doc/specifications-fonct/02-format-et-generation.md)
pour le détail complet et un exemple conforme.

## Développement

Le développement utilise Node.js uniquement pour l'outillage de test ; il n'est pas
nécessaire pour utiliser l'application.

```bash
npm ci                        # installe les dépendances de développement (Playwright)
npm test                      # tests unitaires (node:test) sur la couche domaine/services
npm run test:e2e:install      # installe les navigateurs Playwright (une seule fois)
npm run test:e2e              # tests de bout en bout (Chromium, Firefox, WebKit)
npm run serve                 # sert le projet en local sur http://localhost:4173
```

### Organisation du code

| Emplacement | Contenu |
|---|---|
| `index.html`, `assets/css/styles.css` | Structure et styles |
| `assets/js/domain/` | Règles métier pures (contrat JSON, catalogue, préférences, moteur de quiz) |
| `assets/js/services/` | Accès navigateur (fichiers, répertoire, `localStorage`) |
| `assets/js/content/prompt.js` | Texte du prompt de génération, embarqué |
| `cours/` | Cours JSON préchargés et manifeste `index.json` |
| `assets/js/app.js` | Orchestration de l'interface |
| `tests/unit/` | Tests `node:test` de la couche domaine/services |
| `tests/e2e/` | Parcours Playwright (navigateur réel, `localhost` et `file://`) |
| `tests/fixtures/` | Cours JSON utilisés par les tests |

Les scripts `assets/js/*.js` sont des scripts classiques (pas de modules ES), chargés
dans l'ordre déclaré dans `index.html`. Le catalogue embarqué utilise `fetch` et
nécessite donc un hébergement HTTP ; le mode `file://` conserve l'import manuel.

## Limites connues de cette version

- Aucune reprise de quiz après rechargement ou fermeture de la page : la progression
  et le bilan ne sont pas conservés.
- Aucun historique des scores entre plusieurs quiz.
- La sélection d'un répertoire, l'écriture automatique et le presse-papiers dépendent
  des capacités réelles du navigateur ; le mode manuel reste toujours disponible en repli.
- Memio valide la structure des fichiers importés, pas l'exactitude pédagogique de leur
  contenu : relisez toujours les réponses générées par une IA externe.
- Les tests Playwright simulant les permissions de répertoire ne remplacent pas une
  recette manuelle réelle sur un navigateur compatible (Chrome/Edge).
