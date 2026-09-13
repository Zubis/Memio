'use strict';

/**
 * Charge un ou plusieurs scripts classiques Memio (sans modules ES) dans le processus
 * Node courant, en les évaluant tels quels avec `vm`. Les scripts s'attachent à
 * `globalThis.Memio`, exactement comme dans le navigateur (voir assets/js/domain/*.js).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function chargerScripts(cheminsRelatifs) {
  const racine = path.join(__dirname, '..', '..');
  cheminsRelatifs.forEach((relatif) => {
    const chemin = path.join(racine, relatif);
    const code = fs.readFileSync(chemin, 'utf8');
    vm.runInThisContext(code, { filename: chemin });
  });
  return globalThis.Memio;
}

module.exports = { chargerScripts };
