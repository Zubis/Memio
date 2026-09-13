/**
 * Memio — domaine : catalogue des cours chargés (voir doc/specifications-fonct/01-gestion-des-cours.md).
 */
(function (global) {
  'use strict';

  var Memio = (global.Memio = global.Memio || {});
  Memio.domain = Memio.domain || {};

  /**
   * Construit une entrée de catalogue à partir d'un cours validé.
   * `source` vaut 'repertoire' ou 'import' ; `persiste` indique si le fichier
   * est effectivement présent sur disque au moment de l'ajout.
   */
  function creerEntree(nomFichier, cours, source, persiste) {
    return {
      nomFichier: nomFichier,
      nom: cours.cours,
      description: cours.description,
      nombreQuestions: cours.questions.length,
      cours: cours,
      source: source,
      persiste: !!persiste
    };
  }

  function comparerFrancais(a, b) {
    return a.localeCompare(b, 'fr', { sensitivity: 'base' });
  }

  /**
   * Trie le catalogue par nom de cours puis par nom de fichier (règle COU-05).
   */
  function trierCatalogue(entrees) {
    return entrees.slice().sort(function (a, b) {
      var parNom = comparerFrancais(a.nom, b.nom);
      if (parNom !== 0) {
        return parNom;
      }
      return comparerFrancais(a.nomFichier, b.nomFichier);
    });
  }

  /**
   * Un nom de fichier existe-t-il déjà dans le catalogue courant (règle COU-09) ?
   */
  function contientNomFichier(entrees, nomFichier) {
    return entrees.some(function (entree) {
      return entree.nomFichier === nomFichier;
    });
  }

  /**
   * Ajoute une entrée validée au catalogue si son nom de fichier n'est pas déjà présent.
   * Retourne { ajoute: true, catalogue } ou { ajoute: false, motif }.
   */
  function ajouterAuCatalogue(entrees, nomFichier, cours, source, persiste) {
    if (contientNomFichier(entrees, nomFichier)) {
      return { ajoute: false, motif: 'Un fichier nommé "' + nomFichier + '" est déjà chargé.' };
    }
    var nouvelleEntree = creerEntree(nomFichier, cours, source, persiste);
    return { ajoute: true, catalogue: trierCatalogue(entrees.concat([nouvelleEntree])) };
  }

  /**
   * Retire les entrées dont le nom de fichier n'est plus présent (utilisé lors d'une actualisation).
   */
  function filtrerParNomsPresents(entrees, nomsPresents) {
    var ensemble = new Set(nomsPresents);
    return entrees.filter(function (entree) {
      return ensemble.has(entree.nomFichier);
    });
  }

  Memio.domain.catalog = {
    creerEntree: creerEntree,
    trierCatalogue: trierCatalogue,
    contientNomFichier: contientNomFichier,
    ajouterAuCatalogue: ajouterAuCatalogue,
    filtrerParNomsPresents: filtrerParNomsPresents
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
