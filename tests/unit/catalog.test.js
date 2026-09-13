'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chargerScripts } = require('../helpers/load-script');

const Memio = chargerScripts(['assets/js/domain/catalog.js']);
const { creerEntree, trierCatalogue, contientNomFichier, ajouterAuCatalogue, filtrerParNomsPresents } =
  Memio.domain.catalog;

function coursFactice(nom, description, nbQuestions) {
  const questions = [];
  for (let i = 0; i < nbQuestions; i += 1) {
    questions.push({
      question: 'Q' + i,
      reponse: 'R' + i,
      explication: 'E' + i,
      theme: 'T',
      difficulte: 'facile',
      tags: ['x']
    });
  }
  return { cours: nom, description: description, questions: questions };
}

test('AC-COU-05 (partiel) : le catalogue est trié par nom puis fichier', () => {
  const entrees = [
    creerEntree('b.json', coursFactice('Beta', 'd', 1), 'import', false),
    creerEntree('a2.json', coursFactice('Alpha', 'd', 1), 'import', false),
    creerEntree('a1.json', coursFactice('Alpha', 'd', 1), 'import', false)
  ];
  const trie = trierCatalogue(entrees);
  assert.deepEqual(
    trie.map((e) => e.nomFichier),
    ['a1.json', 'a2.json', 'b.json']
  );
});

test('AC-COU-08 : deux fichiers différents peuvent porter le même nom de cours', () => {
  const entrees = [
    creerEntree('fichier1.json', coursFactice('Même nom', 'd', 1), 'import', false),
    creerEntree('fichier2.json', coursFactice('Même nom', 'd', 1), 'import', false)
  ];
  const trie = trierCatalogue(entrees);
  assert.equal(trie.length, 2);
  assert.notEqual(trie[0].nomFichier, trie[1].nomFichier);
});

test('AC-COU-07 : un import dont le nom de fichier existe déjà est refusé', () => {
  const entrees = [creerEntree('cours.json', coursFactice('Cours', 'd', 1), 'import', false)];
  assert.equal(contientNomFichier(entrees, 'cours.json'), true);

  const resultat = ajouterAuCatalogue(entrees, 'cours.json', coursFactice('Autre', 'd', 1), 'import', false);
  assert.equal(resultat.ajoute, false);
  assert.match(resultat.motif, /déjà chargé/);
});

test('un import avec un nouveau nom de fichier est accepté et trié', () => {
  const entrees = [creerEntree('a.json', coursFactice('A', 'd', 1), 'import', false)];
  const resultat = ajouterAuCatalogue(entrees, 'b.json', coursFactice('B', 'd', 2), 'repertoire', true);
  assert.equal(resultat.ajoute, true);
  assert.equal(resultat.catalogue.length, 2);
});

test('AC-COU-10 : une actualisation retire les fichiers qui ne sont plus présents', () => {
  const entrees = [
    creerEntree('a.json', coursFactice('A', 'd', 1), 'repertoire', true),
    creerEntree('b.json', coursFactice('B', 'd', 1), 'repertoire', true)
  ];
  const restant = filtrerParNomsPresents(entrees, ['a.json']);
  assert.deepEqual(
    restant.map((e) => e.nomFichier),
    ['a.json']
  );
});
