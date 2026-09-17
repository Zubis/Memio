'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { chargerScripts } = require('../helpers/load-script');

const Memio = chargerScripts(['assets/js/domain/course.js', 'assets/js/services/files.js']);
const { estFichierJson, chargerCoursEmbarques, validerFichiersImportes } = Memio.services.files;
const fetchOriginal = globalThis.fetch;

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

function reponseHttp(status, texte) {
  return {
    ok: status >= 200 && status < 300,
    status: status,
    text: () => Promise.resolve(texte)
  };
}

test.afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

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

test('les cours embarqués déclarés dans le manifeste sont chargés et validés', async () => {
  globalThis.fetch = async (url) => {
    if (url === 'cours/index.json') {
      return reponseHttp(200, JSON.stringify(['valide.json']));
    }
    if (url === 'cours/valide.json') {
      return reponseHttp(200, coursValideTexte);
    }
    return reponseHttp(404, '');
  };

  const resultat = await chargerCoursEmbarques('cours/index.json');
  assert.equal(resultat.acceptes.length, 1);
  assert.equal(resultat.acceptes[0].nomFichier, 'valide.json');
  assert.equal(resultat.acceptes[0].cours.cours, 'Cours test');
  assert.equal(resultat.rejetes.length, 0);
});

test('un manifeste absent laisse le catalogue embarqué vide sans erreur', async () => {
  globalThis.fetch = async () => reponseHttp(404, '');

  const resultat = await chargerCoursEmbarques('cours/index.json');
  assert.deepEqual(resultat, { acceptes: [], rejetes: [] });
});

test('le manifeste rejette les chemins dangereux et les fichiers non JSON', async () => {
  globalThis.fetch = async (url) => {
    if (url === 'cours/index.json') {
      return reponseHttp(200, JSON.stringify(['../secret.json', '/absolu.json', 'notes.pdf', 'valide.json']));
    }
    if (url === 'cours/valide.json') {
      return reponseHttp(200, coursValideTexte);
    }
    return reponseHttp(404, '');
  };

  const resultat = await chargerCoursEmbarques('cours/index.json');
  assert.equal(resultat.acceptes.length, 1);
  assert.deepEqual(
    resultat.rejetes.map((rejet) => rejet.nomFichier),
    ['../secret.json', '/absolu.json', 'notes.pdf']
  );
});

test('un JSON embarqué invalide est rejeté sans bloquer les autres cours', async () => {
  globalThis.fetch = async (url) => {
    if (url === 'cours/index.json') {
      return reponseHttp(200, JSON.stringify(['invalide.json', 'valide.json']));
    }
    if (url === 'cours/invalide.json') {
      return reponseHttp(200, JSON.stringify({ cours: '', description: 'd', questions: [] }));
    }
    if (url === 'cours/valide.json') {
      return reponseHttp(200, coursValideTexte);
    }
    return reponseHttp(404, '');
  };

  const resultat = await chargerCoursEmbarques('cours/index.json');
  assert.equal(resultat.acceptes.length, 1);
  assert.equal(resultat.rejetes.length, 1);
  assert.equal(resultat.rejetes[0].nomFichier, 'invalide.json');
});
