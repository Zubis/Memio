/**
 * Memio — domaine : contrat des fichiers de cours (voir doc/specifications-fonct/02-format-et-generation.md).
 * Script classique sans dépendance DOM : utilisable tel quel dans le navigateur et en test Node.
 */
(function (global) {
  'use strict';

  var Memio = (global.Memio = global.Memio || {});
  Memio.domain = Memio.domain || {};

  var DIFFICULTES_AUTORISEES = ['facile', 'moyen', 'difficile'];

  function estChaineNonVide(valeur) {
    return typeof valeur === 'string' && valeur.trim().length > 0;
  }

  function estTableauDeChainesNonVides(valeur) {
    return (
      Array.isArray(valeur) &&
      valeur.length > 0 &&
      valeur.every(function (item) {
        return estChaineNonVide(item);
      })
    );
  }

  /**
   * Valide une question à l'index donné. Retourne un tableau d'erreurs (vide si valide).
   */
  function validerQuestion(question, index) {
    var erreurs = [];
    var prefixe = 'questions[' + index + ']';

    if (question === null || typeof question !== 'object' || Array.isArray(question)) {
      return [{ chemin: prefixe, message: 'La question doit être un objet.' }];
    }

    if (!estChaineNonVide(question.question)) {
      erreurs.push({ chemin: prefixe + '.question', message: 'Le champ "question" est obligatoire et ne doit pas être vide.' });
    }
    if (!estChaineNonVide(question.reponse)) {
      erreurs.push({ chemin: prefixe + '.reponse', message: 'Le champ "reponse" est obligatoire et ne doit pas être vide.' });
    }
    if (!estChaineNonVide(question.explication)) {
      erreurs.push({ chemin: prefixe + '.explication', message: 'Le champ "explication" est obligatoire et ne doit pas être vide.' });
    }
    if (!estChaineNonVide(question.theme)) {
      erreurs.push({ chemin: prefixe + '.theme', message: 'Le champ "theme" est obligatoire et ne doit pas être vide.' });
    }
    if (DIFFICULTES_AUTORISEES.indexOf(question.difficulte) === -1) {
      erreurs.push({
        chemin: prefixe + '.difficulte',
        message: 'Le champ "difficulte" doit valoir exactement "facile", "moyen" ou "difficile".'
      });
    }
    if (!estTableauDeChainesNonVides(question.tags)) {
      erreurs.push({ chemin: prefixe + '.tags', message: 'Le champ "tags" doit être un tableau d\'au moins une chaîne non vide.' });
    }

    return erreurs;
  }

  /**
   * Valide un objet JSON de cours déjà analysé (JSON.parse effectué en amont).
   * Retourne { valide: true, cours: {...} } ou { valide: false, erreurs: [...] }.
   */
  function validerCours(donnees, nomFichier) {
    var erreurs = [];

    if (donnees === null || typeof donnees !== 'object' || Array.isArray(donnees)) {
      return {
        valide: false,
        nomFichier: nomFichier,
        erreurs: [{ chemin: '', message: 'Le fichier doit contenir un unique objet JSON.' }]
      };
    }

    if (!estChaineNonVide(donnees.cours)) {
      erreurs.push({ chemin: 'cours', message: 'Le champ "cours" est obligatoire et ne doit pas être vide.' });
    }
    if (!estChaineNonVide(donnees.description)) {
      erreurs.push({ chemin: 'description', message: 'Le champ "description" est obligatoire et ne doit pas être vide.' });
    }
    if (!Array.isArray(donnees.questions) || donnees.questions.length === 0) {
      erreurs.push({ chemin: 'questions', message: 'Le champ "questions" doit être un tableau contenant au moins une question.' });
    } else {
      donnees.questions.forEach(function (question, index) {
        erreurs = erreurs.concat(validerQuestion(question, index));
      });
    }

    if (erreurs.length > 0) {
      return { valide: false, nomFichier: nomFichier, erreurs: erreurs };
    }

    var coursNormalise = {
      cours: donnees.cours,
      description: donnees.description,
      questions: donnees.questions.map(function (question) {
        return {
          question: question.question,
          reponse: question.reponse,
          explication: question.explication,
          theme: question.theme,
          difficulte: question.difficulte,
          tags: question.tags.slice()
        };
      })
    };

    return { valide: true, nomFichier: nomFichier, cours: coursNormalise };
  }

  /**
   * Analyse un texte JSON brut puis valide sa structure.
   * Distingue une erreur de syntaxe JSON d'une erreur de structure.
   */
  function analyserEtValiderCours(texteJson, nomFichier) {
    var donnees;
    try {
      donnees = JSON.parse(texteJson);
    } catch (erreurSyntaxe) {
      return {
        valide: false,
        nomFichier: nomFichier,
        erreurs: [{ chemin: '', message: 'JSON invalide : ' + erreurSyntaxe.message, syntaxe: true }]
      };
    }
    return validerCours(donnees, nomFichier);
  }

  /**
   * Sérialise un cours validé en texte JSON réimportable, ne contenant que les champs reconnus.
   */
  function serialiserCours(cours) {
    return JSON.stringify(
      {
        cours: cours.cours,
        description: cours.description,
        questions: cours.questions.map(function (question) {
          return {
            question: question.question,
            reponse: question.reponse,
            explication: question.explication,
            theme: question.theme,
            difficulte: question.difficulte,
            tags: question.tags.slice()
          };
        })
      },
      null,
      2
    );
  }

  Memio.domain.course = {
    DIFFICULTES_AUTORISEES: DIFFICULTES_AUTORISEES,
    validerCours: validerCours,
    analyserEtValiderCours: analyserEtValiderCours,
    serialiserCours: serialiserCours
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
