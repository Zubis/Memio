'use strict';

/**
 * Serveur statique minimal réservé au développement et aux tests (Playwright, `npm run serve`).
 * Ne fait pas partie de l'application livrée : Memio reste utilisable sans Node.js via file://.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..', '..');
const PORT = process.env.MEMIO_TEST_PORT ? Number(process.env.MEMIO_TEST_PORT) : 4173;

const TYPES_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function creerServeur() {
  return http.createServer((requete, reponse) => {
    let cheminUrl = decodeURIComponent(requete.url.split('?')[0]);
    if (cheminUrl === '/') {
      cheminUrl = '/index.html';
    }
    const cheminFichier = path.normalize(path.join(RACINE, cheminUrl));

    if (!cheminFichier.startsWith(RACINE)) {
      reponse.writeHead(403);
      reponse.end('Interdit');
      return;
    }

    fs.readFile(cheminFichier, (erreur, contenu) => {
      if (erreur) {
        reponse.writeHead(404);
        reponse.end('Introuvable');
        return;
      }
      const extension = path.extname(cheminFichier);
      reponse.writeHead(200, { 'Content-Type': TYPES_MIME[extension] || 'application/octet-stream' });
      reponse.end(contenu);
    });
  });
}

if (require.main === module) {
  creerServeur().listen(PORT, () => {
    console.log('Serveur statique Memio sur http://localhost:' + PORT);
  });
}

module.exports = { creerServeur, PORT };
