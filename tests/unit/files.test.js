'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chargerScripts } = require('../helpers/load-script');

const Memio = chargerScripts(['assets/js/domain/course.js', 'assets/js/services/files.js']);
const { estFichierJson, validerFichiersImportes } = Memio.services.files;

const coursValideTexte = JSON.stringify({
  cours: 'Cours test',
  description: 'Description',
  questions: [
    {
      question: 'Q1',
      reponse: 'R1',
      explication: 'E1',
      theme: 'T1',
      difficulte: 'facile',
      tags: ['t']
    }
  ]
});

function fichierFactice(nom, texte) {
  return { name: nom, text: () => Promise.resolve(texte) };
}

test('estFichierJson ignore les fichiers sans extension .json', () => {
  assert.equal(estFichierJson('cours.json'), true);
  assert.equal(estFichierJson('COURS.JSON'), true);
  assert.equal(estFichierJson('cours.pdf'), false);
  assert.equal(estFichierJson('notes.md'), false);
});

test('AC-COU-01 : un import mixte accepte les fichiers valides et rejette les autres', async () => {
  const fichiers = [
    fichierFactice('valide.json', coursValideTexte),
    fichierFactice('invalide.json', JSON.stringify({ cours: '', description: 'd', questions: [] }))
  ];
  const resultat = await validerFichiersImportes(fichiers);
  assert.equal(resultat.acceptes.length, 1);
  assert.equal(resultat.rejetes.length, 1);
  assert.equal(resultat.acceptes[0].nomFichier, 'valide.json');
  assert.equal(resultat.rejetes[0].nomFichier, 'invalide.json');
});

test('un import ne bloque pas les autres fichiers en cas d’échec de lecture', async () => {
  const fichierEnErreur = {
    name: 'illisible.json',
    text: () => Promise.reject(new Error('disque indisponible'))
  };
  const resultat = await validerFichiersImportes([fichierEnErreur, fichierFactice('valide.json', coursValideTexte)]);
  assert.equal(resultat.acceptes.length, 1);
  assert.equal(resultat.rejetes.length, 1);
  assert.match(resultat.rejetes[0].erreurs[0].message, /impossible/);
});
