/**
 * Memio — contenu : prompt de génération externe (voir doc/specifications-fonct/02-format-et-generation.md, IA-01 à 04).
 * Texte embarqué, sans requête réseau.
 */
(function (global) {
  'use strict';

  var Memio = (global.Memio = global.Memio || {});
  Memio.content = Memio.content || {};

  var PROMPT = [
    "Tu es un assistant pédagogique. À partir du cours fourni ci-dessous, génère un jeu de",
    "questions/réponses de révision en français, destiné à un·e étudiant·e.",
    "",
    "Le cours source ce trouve en pièce jointe.",
    "Nombre de questions à générer : En fonction de la longueur et de la complexité du cours.",
    "",
    "Consignes :",
    "1. Fonde chaque question et réponse uniquement sur le contenu du cours fourni ci-dessus.",
    "   N'invente aucune information qui n'y figure pas.",
    "2. Couvre les notions importantes du cours, sans répéter deux fois la même question",
    "   et sans questions redondantes entre elles.",
    "3. Pour chaque question, fournis aussi une explication pédagogique complémentaire,",
    "   un thème ou chapitre, un niveau de difficulté et au moins un tag (mot-clé).",
    "4. Le niveau de difficulté doit être exactement l'une de ces trois valeurs :",
    "   \"facile\", \"moyen\" ou \"difficile\" (rien d'autre).",
    "5. Réponds uniquement avec un unique objet JSON, strictement conforme au format",
    "   ci-dessous. N'ajoute aucun texte avant ou après, aucun commentaire, et n'entoure",
    "   pas la réponse de balises de bloc de code (pas de ``` ).",
    "6. Échappe correctement les guillemets et les retours à la ligne dans les chaînes JSON.",
    "7. Tous les champs listés sont obligatoires pour chaque question et pour le cours.",
    "",
    "Format JSON attendu :",
    "{",
    '  "cours": "Nom du cours",',
    '  "description": "Description courte du cours",',
    '  "questions": [',
    '    {',
    '      "question": "Texte de la question",',
    '      "reponse": "Texte de la réponse",',
    '      "explication": "Explication pédagogique complémentaire",',
    '      "theme": "Chapitre ou thème abordé",',
    '      "difficulte": "facile",',
    '      "tags": ["mot-clé1", "mot-clé2"]',
    '    }',
    '  ]',
    "}"
  ].join('\n');

  Memio.content.prompt = {
    texte: PROMPT
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
