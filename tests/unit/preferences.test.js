'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chargerScripts } = require('../helpers/load-script');

function creerStockageFactice() {
  const donnees = new Map();
  return {
    getItem(cle) {
      return donnees.has(cle) ? donnees.get(cle) : null;
    },
    setItem(cle, valeur) {
      donnees.set(cle, String(valeur));
    },
    removeItem(cle) {
      donnees.delete(cle);
    }
  };
}

function creerStockageIndisponible() {
  return {
    getItem() {
      throw new Error('accès refusé');
    },
    setItem() {
      throw new Error('accès refusé');
    },
    removeItem() {
      throw new Error('accès refusé');
    }
  };
}

// Charge le domaine des préférences puis le service (dépendance requise par le script).
globalThis.localStorage = creerStockageFactice();
const Memio = chargerScripts(['assets/js/domain/settings.js', 'assets/js/services/preferences.js']);
const { chargerPreferences, enregistrerPreferences } = Memio.services.preferences;

test('AC-PAR-01 : sans préférences enregistrées, les valeurs initiales sont retournées', () => {
  globalThis.localStorage = creerStockageFactice();
  const resultat = chargerPreferences();
  assert.equal(resultat.source, 'valeurs_initiales');
  assert.equal(resultat.preferences.nombreQuestionsParDefaut, 10);
  assert.equal(resultat.preferences.autoEvaluationActivee, false);
});

test('AC-PAR-02 : des préférences enregistrées valides sont relues à l’identique', () => {
  globalThis.localStorage = creerStockageFactice();
  enregistrerPreferences({ nombreQuestionsParDefaut: 15, autoEvaluationActivee: true });
  const resultat = chargerPreferences();
  assert.equal(resultat.source, 'stockage');
  assert.deepEqual(resultat.preferences, { nombreQuestionsParDefaut: 15, autoEvaluationActivee: true });
});

test('AC-PAR-03 : un stockage indisponible retombe sur les valeurs initiales avec avertissement', () => {
  globalThis.localStorage = creerStockageIndisponible();
  const resultat = chargerPreferences();
  assert.equal(resultat.source, 'valeurs_initiales');
  assert.ok(resultat.avertissement);

  const enregistrement = enregistrerPreferences({ nombreQuestionsParDefaut: 5, autoEvaluationActivee: false });
  assert.equal(enregistrement.enregistre, false);
  assert.ok(enregistrement.avertissement);
});

test('AC-PAR-03 (variante) : des préférences stockées corrompues sont remplacées', () => {
  const stockage = creerStockageFactice();
  stockage.setItem('memio.preferences.v1', '{ceci n\'est pas du JSON');
  globalThis.localStorage = stockage;
  const resultat = chargerPreferences();
  assert.equal(resultat.source, 'valeurs_initiales');
  assert.ok(resultat.avertissement);
});
