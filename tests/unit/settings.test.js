'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chargerScripts } = require('../helpers/load-script');

const Memio = chargerScripts(['assets/js/domain/settings.js']);
const { VALEURS_INITIALES, validerNombreQuestions, validerPreferences } = Memio.domain.settings;

test('AC-PAR-01 : les valeurs initiales sont 10 et auto-évaluation désactivée', () => {
  assert.equal(VALEURS_INITIALES.nombreQuestionsParDefaut, 10);
  assert.equal(VALEURS_INITIALES.autoEvaluationActivee, false);
});

test('AC-CFG-04 : quantité vide, zéro, négative, décimale ou non numérique sont rejetées', () => {
  assert.equal(validerNombreQuestions('').valide, false);
  assert.equal(validerNombreQuestions('0').valide, false);
  assert.equal(validerNombreQuestions('-1').valide, false);
  assert.equal(validerNombreQuestions('2,5').valide, false);
  assert.equal(validerNombreQuestions('2.5').valide, false);
  assert.equal(validerNombreQuestions('abc').valide, false);
  assert.equal(validerNombreQuestions(undefined).valide, false);
});

test('une saisie entière strictement positive est acceptée', () => {
  const resultat = validerNombreQuestions('15');
  assert.equal(resultat.valide, true);
  assert.equal(resultat.valeur, 15);
});

test('AC-PAR-03 : des préférences stockées invalides sont détectées', () => {
  assert.equal(validerPreferences(null).valide, false);
  assert.equal(validerPreferences({ nombreQuestionsParDefaut: -1, autoEvaluationActivee: false }).valide, false);
  assert.equal(validerPreferences({ nombreQuestionsParDefaut: 5, autoEvaluationActivee: 'oui' }).valide, false);
  const ok = validerPreferences({ nombreQuestionsParDefaut: 5, autoEvaluationActivee: true });
  assert.equal(ok.valide, true);
  assert.deepEqual(ok.preferences, { nombreQuestionsParDefaut: 5, autoEvaluationActivee: true });
});
