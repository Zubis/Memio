'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chargerScripts } = require('../helpers/load-script');

const Memio = chargerScripts(['assets/js/domain/quiz.js']);
const {
  construireStock,
  calculerQuantiteEffective,
  melanger,
  tirerQuestions,
  creerEtatQuiz,
  revelerQuestion,
  evaluerQuestion,
  suivant,
  precedent,
  passer,
  allerA,
  estComplet,
  calculerBilan
} = Memio.domain.quiz;

function entreeCatalogue(nomFichier, nomCours, nbQuestions) {
  const questions = [];
  for (let i = 0; i < nbQuestions; i += 1) {
    questions.push({
      question: nomCours + '-Q' + i,
      reponse: 'R' + i,
      explication: 'E' + i,
      theme: 'T',
      difficulte: 'facile',
      tags: ['x']
    });
  }
  return { nomFichier, nom: nomCours, cours: { cours: nomCours, questions } };
}

function rngFixe(sequence) {
  let i = 0;
  return () => sequence[i++ % sequence.length];
}

test('AC-CFG-02 : le stock est la somme des questions des cours sélectionnés', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 6), entreeCatalogue('b.json', 'B', 9)]);
  assert.equal(stock.length, 15);
});

test('AC-CFG-03 : la quantité effective est le minimum entre demande et stock', () => {
  assert.equal(calculerQuantiteEffective(10, 7), 7);
  assert.equal(calculerQuantiteEffective(5, 20), 5);
});

test('le mélange conserve tous les éléments (permutation)', () => {
  const original = [1, 2, 3, 4, 5];
  const melange = melanger(original, rngFixe([0.9, 0.1, 0.5, 0.2, 0]));
  assert.equal(melange.length, original.length);
  assert.deepEqual(melange.slice().sort(), original.slice().sort());
});

test('AC-CFG-05 : un tirage de 8 parmi 15 donne 8 identités distinctes du bon périmètre', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 6), entreeCatalogue('b.json', 'B', 9)]);
  const tirage = tirerQuestions(stock, 8, Math.random);
  assert.equal(tirage.length, 8);
  const identites = new Set(tirage.map((q) => q.nomFichierCours + '#' + q.index));
  assert.equal(identites.size, 8);
  tirage.forEach((q) => {
    assert.ok(q.nomFichierCours === 'a.json' || q.nomFichierCours === 'b.json');
  });
});

test('AC-CFG-06 : un tirage égal au stock retourne toutes les identités une fois', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 5)]);
  const tirage = tirerQuestions(stock, 5, Math.random);
  const identites = new Set(tirage.map((q) => q.index));
  assert.equal(identites.size, 5);
});

test('AC-QUI-01/02 : la réponse est masquée avant révélation puis visible après', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 3)]);
  const etat = creerEtatQuiz(stock, false);
  assert.equal(etat.questions[0].revelee, false);
  revelerQuestion(etat);
  assert.equal(etat.questions[0].revelee, true);
});

test('AC-QUI-02/AC-QUI-03 : navigation conserve les états (révélé ou masqué) au retour', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 3)]);
  const etat = creerEtatQuiz(stock, false);
  revelerQuestion(etat, 0);
  suivant(etat); // vers 1, sans révéler ni évaluer
  precedent(etat); // retour vers 0
  assert.equal(etat.questions[0].revelee, true);
  assert.equal(etat.questions[1].revelee, false);
});

test('AC-QUI-04 : "passer" avance sans révéler la question courante', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 3)]);
  const etat = creerEtatQuiz(stock, false);
  passer(etat);
  assert.equal(etat.indexCourant, 1);
  assert.equal(etat.questions[0].revelee, false);
});

test('AC-QUI-04 (bornes) : précédent/suivant sont sans effet aux bornes', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 2)]);
  const etat = creerEtatQuiz(stock, false);
  precedent(etat);
  assert.equal(etat.indexCourant, 0);
  suivant(etat);
  suivant(etat);
  assert.equal(etat.indexCourant, 1);
  allerA(etat, 5);
  assert.equal(etat.indexCourant, 1);
});

test('AC-EVA-02 : impossible d’évaluer avant révélation', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 1)]);
  const etat = creerEtatQuiz(stock, true);
  evaluerQuestion(etat, 0, true);
  assert.equal(etat.questions[0].evaluation, null);
});

test('AC-EVA-03 : une nouvelle évaluation remplace la précédente sans double comptage', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 1)]);
  const etat = creerEtatQuiz(stock, true);
  revelerQuestion(etat, 0);
  evaluerQuestion(etat, 0, true);
  evaluerQuestion(etat, 0, false);
  assert.equal(etat.questions[0].evaluation, 'incorrect');
});

test('EVA-01 : sans auto-évaluation, evaluerQuestion reste sans effet', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 1)]);
  const etat = creerEtatQuiz(stock, false);
  revelerQuestion(etat, 0);
  evaluerQuestion(etat, 0, true);
  assert.equal(etat.questions[0].evaluation, null);
});

test('AC-FIN-03 : atteindre la dernière question ne complète pas automatiquement le quiz', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 2)]);
  const etat = creerEtatQuiz(stock, false);
  suivant(etat);
  assert.equal(estComplet(etat), false);
});

test('un quiz est complet quand toutes les réponses sont révélées (mode sans évaluation)', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 2)]);
  const etat = creerEtatQuiz(stock, false);
  revelerQuestion(etat, 0);
  revelerQuestion(etat, 1);
  assert.equal(estComplet(etat), true);
});

test('AC-BIL-01 : 10 questions, 3 correctes, 2 incorrectes, 5 non évaluées → score 60 %', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 10)]);
  const etat = creerEtatQuiz(stock, true);
  for (let i = 0; i < 5; i += 1) {
    revelerQuestion(etat, i);
  }
  evaluerQuestion(etat, 0, true);
  evaluerQuestion(etat, 1, true);
  evaluerQuestion(etat, 2, true);
  evaluerQuestion(etat, 3, false);
  evaluerQuestion(etat, 4, false);

  const bilan = calculerBilan(etat);
  assert.equal(bilan.correctes, 3);
  assert.equal(bilan.incorrectes, 2);
  assert.equal(bilan.evaluees, 5);
  assert.equal(bilan.nonEvaluees, 5);
  assert.equal(bilan.pourcentage, 60);
});

test('AC-BIL-02 : sans aucune évaluation, le score est null (pas de division par zéro)', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 3)]);
  const etat = creerEtatQuiz(stock, true);
  const bilan = calculerBilan(etat);
  assert.equal(bilan.evaluees, 0);
  assert.equal(bilan.score, null);
  assert.equal(bilan.pourcentage, null);
});

test('AC-BIL-03 : consulter le bilan ne modifie pas rétroactivement les compteurs', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 3)]);
  const etat = creerEtatQuiz(stock, false);
  revelerQuestion(etat, 0);
  const bilan1 = calculerBilan(etat);
  const bilan2 = calculerBilan(etat);
  assert.deepEqual(bilan1, bilan2);
});

test('sans auto-évaluation, le bilan ne porte pas d’indicateurs de score', () => {
  const stock = construireStock([entreeCatalogue('a.json', 'A', 2)]);
  const etat = creerEtatQuiz(stock, false);
  const bilan = calculerBilan(etat);
  assert.equal(bilan.score, undefined);
  assert.equal(bilan.correctes, undefined);
});
