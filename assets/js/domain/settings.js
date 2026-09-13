/**
 * Memio — domaine : préférences utilisateur (voir doc/specifications-fonct/03-configuration.md, PAR-01 à 04).
 */
(function (global) {
  'use strict';

  var Memio = (global.Memio = global.Memio || {});
  Memio.domain = Memio.domain || {};

  var VALEURS_INITIALES = Object.freeze({
    nombreQuestionsParDefaut: 10,
    autoEvaluationActivee: false
  });

  /**
   * Un entier strictement positif, représentable exactement (pas de perte de précision).
   */
  function estEntierStrictementPositif(valeur) {
    return typeof valeur === 'number' && Number.isInteger(valeur) && valeur > 0 && Number.isSafeInteger(valeur);
  }

  /**
   * Valide une saisie brute de nombre de questions par défaut (chaîne ou nombre).
   * Retourne { valide: true, valeur } ou { valide: false, message }.
   */
  function validerNombreQuestions(saisie) {
    var valeur;
    if (typeof saisie === 'number') {
      valeur = saisie;
    } else if (typeof saisie === 'string' && saisie.trim() !== '') {
      if (!/^\d+$/.test(saisie.trim())) {
        return { valide: false, message: 'Saisissez un nombre entier strictement positif.' };
      }
      valeur = Number(saisie.trim());
    } else {
      return { valide: false, message: 'Le nombre de questions est obligatoire.' };
    }

    if (!estEntierStrictementPositif(valeur)) {
      return { valide: false, message: 'Le nombre de questions doit être un entier strictement positif.' };
    }
    return { valide: true, valeur: valeur };
  }

  /**
   * Valide un objet de préférences complet (utilisé lors de la relecture du stockage local).
   */
  function validerPreferences(objet) {
    if (objet === null || typeof objet !== 'object') {
      return { valide: false };
    }
    var resultatNombre = validerNombreQuestions(objet.nombreQuestionsParDefaut);
    if (!resultatNombre.valide) {
      return { valide: false };
    }
    if (typeof objet.autoEvaluationActivee !== 'boolean') {
      return { valide: false };
    }
    return {
      valide: true,
      preferences: {
        nombreQuestionsParDefaut: resultatNombre.valeur,
        autoEvaluationActivee: objet.autoEvaluationActivee
      }
    };
  }

  Memio.domain.settings = {
    VALEURS_INITIALES: VALEURS_INITIALES,
    validerNombreQuestions: validerNombreQuestions,
    validerPreferences: validerPreferences
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
