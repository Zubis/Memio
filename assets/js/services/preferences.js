/**
 * Memio — service : persistance des préférences (voir doc/specifications-fonct/03-configuration.md, PAR-03).
 * Encapsule localStorage ; sa lecture/écriture peut échouer (mode privé, quota, file://…).
 */
(function (global) {
  'use strict';

  var Memio = (global.Memio = global.Memio || {});
  Memio.services = Memio.services || {};

  var CLE_STOCKAGE = 'memio.preferences.v1';

  function stockageDisponible() {
    try {
      var stockage = global.localStorage;
      var testCle = '__memio_test__';
      stockage.setItem(testCle, '1');
      stockage.removeItem(testCle);
      return true;
    } catch (erreur) {
      return false;
    }
  }

  /**
   * Charge les préférences persistées. Retourne toujours un résultat exploitable :
   * { preferences, source: 'stockage' | 'valeurs_initiales', avertissement? }.
   */
  function chargerPreferences() {
    var settings = Memio.domain.settings;
    if (!stockageDisponible()) {
      return {
        preferences: Object.assign({}, settings.VALEURS_INITIALES),
        source: 'valeurs_initiales',
        avertissement: "Le stockage du navigateur est indisponible : les préférences ne seront pas conservées entre deux visites."
      };
    }

    var brut;
    try {
      brut = global.localStorage.getItem(CLE_STOCKAGE);
    } catch (erreur) {
      return {
        preferences: Object.assign({}, settings.VALEURS_INITIALES),
        source: 'valeurs_initiales',
        avertissement: "Le stockage du navigateur est indisponible : les préférences ne seront pas conservées entre deux visites."
      };
    }

    if (!brut) {
      return { preferences: Object.assign({}, settings.VALEURS_INITIALES), source: 'valeurs_initiales' };
    }

    var objet;
    try {
      objet = JSON.parse(brut);
    } catch (erreur) {
      return {
        preferences: Object.assign({}, settings.VALEURS_INITIALES),
        source: 'valeurs_initiales',
        avertissement: 'Les préférences enregistrées étaient invalides ; les valeurs par défaut ont été restaurées.'
      };
    }

    var validation = settings.validerPreferences(objet);
    if (!validation.valide) {
      return {
        preferences: Object.assign({}, settings.VALEURS_INITIALES),
        source: 'valeurs_initiales',
        avertissement: 'Les préférences enregistrées étaient invalides ; les valeurs par défaut ont été restaurées.'
      };
    }

    return { preferences: validation.preferences, source: 'stockage' };
  }

  /**
   * Enregistre les préférences. Retourne { enregistre: true } ou { enregistre: false, avertissement }.
   */
  function enregistrerPreferences(preferences) {
    if (!stockageDisponible()) {
      return {
        enregistre: false,
        avertissement: 'Le stockage du navigateur est indisponible : ces préférences ne seront appliquées que pour cette visite.'
      };
    }
    try {
      global.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(preferences));
      return { enregistre: true };
    } catch (erreur) {
      return {
        enregistre: false,
        avertissement: 'Échec d\'enregistrement des préférences : ' + erreur.message
      };
    }
  }

  Memio.services.preferences = {
    CLE_STOCKAGE: CLE_STOCKAGE,
    chargerPreferences: chargerPreferences,
    enregistrerPreferences: enregistrerPreferences
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
