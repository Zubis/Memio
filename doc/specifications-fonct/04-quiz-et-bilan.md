# 04 — Déroulement du quiz et bilan

Référence : `BESOIN.md`, §2.5 ; arbitrages complémentaires du 13 septembre 2026.

## Question et navigation

**QUI-01 — Premier affichage.** Le quiz commence sur la première question du tirage.
L'écran montre « Question i sur N », le cours d'origine et la question.
La réponse et l'explication sont masquées, y compris pour les technologies
d'assistance. Thème, difficulté et tags ne sont affichés qu'après révélation afin
de ne pas fournir d'indices involontaires.

**QUI-02 — Révélation.** La question est présentée sous forme de carte qui se
retourne : un clic (ou une activation au clavier, la carte étant focalisable et
identifiée par le nom accessible « Afficher la réponse ») révèle, sur la face
retournée, la réponse, l'explication et les métadonnées aux côtés du rappel de la
question. Aucune saisie de réponse, minuterie ni correction automatique n'est
imposée : l'étudiant réfléchit librement avant de révéler. Une fois la question
révélée, la carte reste affichée côté réponse et n'est plus interactive pour cette
action (l'interaction de révélation est à usage unique par question).

**QUI-03 — Navigation libre.** « Précédent » et « Suivant » changent la question
sans obligation de révélation ou d'évaluation. Ils sont désactivés aux bornes.
Un accès par numéro permet d'atteindre directement n'importe quelle question.
Une liste d'états distingue les questions non révélées, révélées et, lorsque
l'option est active, évaluées correctes ou incorrectes.

**QUI-04 — Passer.** « Passer » avance à la question suivante sans révéler ni
évaluer la question courante, ni modifier son état existant. Sur la dernière
question, ce bouton est désactivé ; « Terminer le quiz » reste disponible.
Une question passée demeure accessible et ne compte pas comme une réponse fausse.

**QUI-05 — Conservation dans le quiz.** Un retour sur une question conserve sa
révélation et sa dernière évaluation. Aucun déplacement ne modifie le tirage.
Les états sont uniquement conservés pendant la visite en cours.

## Auto-évaluation

**EVA-01 — Activation.** Lorsque l'option est désactivée, aucun contrôle
d'évaluation ni score n'apparaît. Lorsqu'elle est activée, les actions
« J'ai répondu correctement » et « Je me suis trompé » apparaissent seulement
après révélation de la réponse.

**EVA-02 — Modification.** L'étudiant peut modifier son évaluation jusqu'à la
fin du quiz. La dernière valeur remplace la précédente ; une question ne contribue
jamais plusieurs fois au score. Révéler une réponse ne vaut pas évaluation.

**EVA-03 — Indicateurs.** Le quiz affiche le nombre de réponses révélées sur `N`.
En mode auto-évaluation, il affiche aussi le nombre de questions évaluées sur `N`.
Une question seulement visitée n'est pas considérée comme traitée.

## Fin et abandon

**FIN-01 — Fin explicite.** « Terminer le quiz » est disponible à tout moment.
Atteindre la dernière question ne termine pas automatiquement le quiz.
Un quiz est complet si toutes les réponses ont été révélées sans auto-évaluation,
ou si toutes les questions ont été évaluées avec auto-évaluation.

**FIN-02 — Fin incomplète.** Terminer un quiz incomplet ouvre une confirmation
avec le nombre de réponses non révélées et, si applicable, de questions non évaluées.
« Continuer le quiz » conserve l'état ; « Terminer quand même » ouvre le bilan.
Un quiz complet ouvre directement le bilan.

**FIN-03 — Abandon.** « Quitter le quiz » demande confirmation, puis revient
à l'accueil sans bilan ni sauvegarde de progression. Annuler conserve le quiz.
Recharger ou fermer la page fait perdre le quiz ; cette limite est annoncée au
lancement. Aucun mécanisme de reprise ou garantie de confirmation à la fermeture
du navigateur n'est prévu.

## Bilan

**BIL-01 — Informations communes.** Le bilan affiche les cours sélectionnés,
le nombre de questions du quiz et le nombre de réponses révélées avant sa fin.
Il liste toutes les questions, leur cours d'origine, leurs réponses et explications,
avec l'état atteint à la fin du quiz. Les questions non traitées sont donc
identifiables séparément.

Afficher une réponse dans le bilan ne modifie pas rétroactivement les compteurs.
Les évaluations ne sont plus modifiables dans le bilan.

**BIL-01bis — Codes couleur.** Lorsque l'auto-évaluation était activée pour le
quiz, chaque question du bilan porte une couleur selon son état final : **vert**
si déclarée correcte, **rouge** si déclarée incorrecte, **gris foncé** pour toute
question non concernée par ces deux cas (révélée sans évaluation, ou non traitée).
Lorsque l'auto-évaluation était désactivée pour tout le quiz, aucune couleur n'est
appliquée : l'affichage reste neutre, dans le style de texte par défaut.

**BIL-02 — Score facultatif.** En mode auto-évaluation :

| Indicateur | Définition |
|---|---|
| `N` | Nombre de questions tirées |
| `C` | Questions déclarées correctes |
| `I` | Questions déclarées incorrectes |
| `E` | Questions évaluées : `C + I` |
| `U` | Questions non évaluées : `N - E` |
| Score | `C / E`, si `E > 0` |
| Pourcentage | `100 × C / E`, arrondi à l'entier le plus proche |

Le bilan précise que le score repose sur les déclarations de l'étudiant et uniquement
sur les questions évaluées. Si `E = 0`, il affiche « Aucune question évaluée » sans
pourcentage ni division par zéro. Sans auto-évaluation, aucun de ces indicateurs
de réussite n'est affiché.

**BIL-03 — Nouveau quiz.** « Retour aux cours » revient à l'accueil, conserve
le catalogue chargé pour la visite et efface la sélection précédente. La configuration
reprend les préférences enregistrées. Un nouveau lancement effectue un nouveau tirage
sans garantir des questions différentes.
Le bilan précédent n'est pas archivé.

## Critères d'acceptation

| ID | Situation / action | Résultat attendu |
|---|---|---|
| AC-QUI-01 | Première consultation d'une question | Ni réponse ni explication accessibles avant révélation |
| AC-QUI-02 | Révélation, suivant, précédent | Réponse toujours visible au retour |
| AC-QUI-03 | Passage sans révélation puis retour direct | Question accessible et réponse toujours masquée |
| AC-QUI-04 | Première / dernière question | Précédent / suivant désactivé, aucune sortie d'index |
| AC-EVA-01 | Auto-évaluation désactivée | Aucun bouton d'évaluation ni score pendant le quiz ou au bilan |
| AC-EVA-02 | Auto-évaluation active avant révélation | Impossible d'évaluer |
| AC-EVA-03 | Évaluation correcte remplacée par incorrecte | Une seule évaluation comptée, incorrecte |
| AC-FIN-01 | Fin avec questions incomplètes puis annulation | Confirmation explicite ; état du quiz conservé |
| AC-FIN-02 | Fin incomplète confirmée | Bilan accessible ; questions non traitées distinguées |
| AC-FIN-03 | Dernière question atteinte | Pas de fin automatique |
| AC-FIN-04 | Abandon confirmé | Accueil sans progression ni bilan sauvegardé |
| AC-BIL-01 | 10 questions, 3 correctes, 2 incorrectes, 5 non évaluées | Score 3/5 (60 %), couverture 5/10, 5 non évaluées |
| AC-BIL-02 | Fin sans aucune évaluation | « Aucune question évaluée », aucun pourcentage |
| AC-BIL-03 | Bilan affichant des réponses non révélées dans le quiz | Compteurs de fin inchangés |
| AC-BIL-04 | Retour aux cours | Catalogue conservé, sélection vide, préférences réappliquées |
| AC-BIL-05 | Auto-évaluation activée, questions correctes/incorrectes/non évaluées | Couleurs vert / rouge / gris foncé respectivement dans le bilan |
| AC-BIL-06 | Auto-évaluation désactivée pour tout le quiz | Aucune couleur dans le bilan (affichage neutre) |
