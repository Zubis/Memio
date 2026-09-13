'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chargerScripts } = require('../helpers/load-script');

const Memio = chargerScripts(['assets/js/domain/course.js']);
const { validerCours, analyserEtValiderCours, serialiserCours } = Memio.domain.course;

const coursValide = {
  cours: 'Biologie — La cellule',
  description: 'Révision des structures cellulaires.',
  questions: [
    {
      question: 'Quel est le rôle principal de la membrane plasmique ?',
      reponse: 'Elle délimite la cellule et contrôle les échanges avec son environnement.',
      explication: 'Sa perméabilité sélective contribue au maintien du milieu intracellulaire.',
      theme: 'Structures cellulaires',
      difficulte: 'facile',
      tags: ['cellule', 'membrane']
    }
  ]
};

test('AC-DAT-01 : un cours conforme est accepté avec sa question', () => {
  const resultat = validerCours(coursValide, 'biologie.json');
  assert.equal(resultat.valide, true);
  assert.equal(resultat.cours.questions.length, 1);
});

test('AC-DAT-02 : un champ obligatoire absent est rejeté avec son chemin', () => {
  const sansDescription = { ...coursValide };
  delete sansDescription.description;
  const resultat = validerCours(sansDescription, 'x.json');
  assert.equal(resultat.valide, false);
  assert.ok(resultat.erreurs.some((e) => e.chemin === 'description'));
});

test('AC-DAT-03 : questions vides, tags vides et texte blanc sont rejetés', () => {
  const vide = { ...coursValide, questions: [] };
  assert.equal(validerCours(vide, 'x.json').valide, false);

  const tagsVides = JSON.parse(JSON.stringify(coursValide));
  tagsVides.questions[0].tags = [];
  assert.equal(validerCours(tagsVides, 'x.json').valide, false);

  const texteBlanc = JSON.parse(JSON.stringify(coursValide));
  texteBlanc.questions[0].question = '   ';
  assert.equal(validerCours(texteBlanc, 'x.json').valide, false);

  const champNull = JSON.parse(JSON.stringify(coursValide));
  champNull.questions[0].reponse = null;
  assert.equal(validerCours(champNull, 'x.json').valide, false);
});

test('AC-DAT-04 : une difficulté hors énumération est rejetée', () => {
  const mauvaiseDifficulte = JSON.parse(JSON.stringify(coursValide));
  mauvaiseDifficulte.questions[0].difficulte = 'moyenne';
  const resultat = validerCours(mauvaiseDifficulte, 'x.json');
  assert.equal(resultat.valide, false);
  assert.ok(resultat.erreurs.some((e) => e.chemin === 'questions[0].difficulte'));

  const chaineDesTrois = JSON.parse(JSON.stringify(coursValide));
  chaineDesTrois.questions[0].difficulte = 'facile | moyen | difficile';
  assert.equal(validerCours(chaineDesTrois, 'x.json').valide, false);
});

test('AC-DAT-05 : un JSON entouré de balises Markdown est rejeté comme erreur de syntaxe', () => {
  const texte = '```json\n' + JSON.stringify(coursValide) + '\n```';
  const resultat = analyserEtValiderCours(texte, 'x.json');
  assert.equal(resultat.valide, false);
  assert.equal(resultat.erreurs[0].syntaxe, true);
});

test('AC-DAT-06 : une question invalide parmi dix rejette le fichier entier', () => {
  const dix = { ...coursValide, questions: [] };
  for (let i = 0; i < 10; i += 1) {
    dix.questions.push(JSON.parse(JSON.stringify(coursValide.questions[0])));
  }
  dix.questions[7].theme = '';
  const resultat = validerCours(dix, 'x.json');
  assert.equal(resultat.valide, false);
});

test('AC-DAT-07 : un cours exporté puis réimporté conserve ses champs fonctionnels', () => {
  const valide = validerCours(coursValide, 'x.json');
  const texte = serialiserCours(valide.cours);
  const reimporte = analyserEtValiderCours(texte, 'x.json');
  assert.equal(reimporte.valide, true);
  assert.deepEqual(reimporte.cours, valide.cours);
});

test('propriétés supplémentaires tolérées mais ignorées à la sérialisation', () => {
  const avecExtra = { ...coursValide, niveau: 'L1' };
  const resultat = validerCours(avecExtra, 'x.json');
  assert.equal(resultat.valide, true);
  assert.equal(resultat.cours.niveau, undefined);
});

test('un objet racine invalide (tableau) est rejeté', () => {
  const resultat = validerCours([], 'x.json');
  assert.equal(resultat.valide, false);
});
