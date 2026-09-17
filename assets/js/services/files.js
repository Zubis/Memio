/**
 * Memio — service : accès aux fichiers de cours (voir doc/specifications-fonct/01-gestion-des-cours.md).
 * Encapsule le File System Access API (répertoire), l'import manuel (<input type="file">)
 * et le téléchargement. Dépend du navigateur ; reste utilisable en mode manuel partout.
 */
(function (global) {
  'use strict';

  var Memio = (global.Memio = global.Memio || {});
  Memio.services = Memio.services || {};

  function apiRepertoireDisponible() {
    return typeof global.showDirectoryPicker === 'function';
  }

  function estFichierJson(nomFichier) {
    return /\.json$/i.test(nomFichier);
  }

  function creerRejet(nomFichier, message) {
    return { nomFichier: nomFichier, erreurs: [{ chemin: '', message: message }] };
  }

  function extraireListeManifeste(manifeste) {
    if (Array.isArray(manifeste)) {
      return manifeste;
    }
    if (manifeste && Array.isArray(manifeste.cours)) {
      return manifeste.cours;
    }
    throw new Error('Le manifeste doit être un tableau ou contenir une propriété "cours" de type tableau.');
  }

  function normaliserEntreeManifeste(entree) {
    var fichier = typeof entree === 'string' ? entree : entree && entree.fichier;
    if (typeof fichier !== 'string' || fichier.trim() === '') {
      return { valide: false, nomFichier: 'entrée du manifeste', message: 'Entrée de manifeste invalide.' };
    }
    fichier = fichier.trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(fichier) || fichier.charAt(0) === '/' || fichier.indexOf('\\') !== -1) {
      return { valide: false, nomFichier: fichier, message: 'Le chemin doit être un nom de fichier relatif dans le dossier cours.' };
    }
    if (fichier.indexOf('/') !== -1 || fichier.split('/').indexOf('..') !== -1 || fichier === '.' || fichier === '..') {
      return { valide: false, nomFichier: fichier, message: 'Le manifeste ne doit référencer que des fichiers à la racine du dossier cours.' };
    }
    if (!estFichierJson(fichier)) {
      return { valide: false, nomFichier: fichier, message: 'Seuls les fichiers .json peuvent être chargés.' };
    }
    return { valide: true, nomFichier: fichier };
  }

  /**
   * Lit le texte d'un objet File (ou compatible .text()).
   */
  function lireTexteFichier(fichier) {
    if (typeof fichier.text === 'function') {
      return fichier.text();
    }
    return new Promise(function (resolve, reject) {
      var lecteur = new global.FileReader();
      lecteur.onload = function () {
        resolve(String(lecteur.result));
      };
      lecteur.onerror = function () {
        reject(lecteur.error || new Error('Lecture du fichier impossible.'));
      };
      lecteur.readAsText(fichier);
    });
  }

  /**
   * Valide un ensemble de fichiers importés manuellement (règle COU-08).
   * Retourne { acceptes: [{nomFichier, cours}], rejetes: [{nomFichier, erreurs}] }.
   */
  function validerFichiersImportes(fichiers) {
    var course = Memio.domain.course;
    var promesses = Array.prototype.map.call(fichiers, function (fichier) {
      return lireTexteFichier(fichier).then(
        function (texte) {
          var resultat = course.analyserEtValiderCours(texte, fichier.name);
          return { nomFichier: fichier.name, resultat: resultat };
        },
        function (erreurLecture) {
          return {
            nomFichier: fichier.name,
            resultat: { valide: false, erreurs: [{ chemin: '', message: 'Lecture impossible : ' + erreurLecture.message }] }
          };
        }
      );
    });

    return Promise.all(promesses).then(function (resultats) {
      var acceptes = [];
      var rejetes = [];
      resultats.forEach(function (item) {
        if (item.resultat.valide) {
          acceptes.push({ nomFichier: item.nomFichier, cours: item.resultat.cours });
        } else {
          rejetes.push({ nomFichier: item.nomFichier, erreurs: item.resultat.erreurs });
        }
      });
      return { acceptes: acceptes, rejetes: rejetes };
    });
  }

  /**
   * Charge les cours embarqués déclarés dans un manifeste statique `cours/index.json`.
   * Retourne { acceptes: [{nomFichier, cours}], rejetes: [{nomFichier, erreurs}] }.
   */
  async function chargerCoursEmbarques(urlManifeste) {
    var course = Memio.domain.course;
    var acceptes = [];
    var rejetes = [];
    if (typeof global.fetch !== 'function') {
      return { acceptes: acceptes, rejetes: [creerRejet(urlManifeste, 'Chargement HTTP indisponible dans ce navigateur.')] };
    }

    var reponseManifeste = await global.fetch(urlManifeste, { cache: 'no-store' });
    if (reponseManifeste.status === 404) {
      return { acceptes: acceptes, rejetes: rejetes };
    }
    if (!reponseManifeste.ok) {
      throw new Error('Manifeste inaccessible (' + reponseManifeste.status + ').');
    }

    var manifeste;
    try {
      manifeste = JSON.parse(await reponseManifeste.text());
    } catch (erreurParseManifeste) {
      throw new Error('Manifeste JSON illisible : ' + erreurParseManifeste.message);
    }

    var liste = extraireListeManifeste(manifeste);
    await Promise.all(liste.map(async function (entree) {
      var normalisation = normaliserEntreeManifeste(entree);
      if (!normalisation.valide) {
        rejetes.push(creerRejet(normalisation.nomFichier, normalisation.message));
        return;
      }

      var nomFichier = normalisation.nomFichier;
      try {
        var reponseCours = await global.fetch('cours/' + encodeURIComponent(nomFichier), { cache: 'no-store' });
        if (!reponseCours.ok) {
          rejetes.push(creerRejet(nomFichier, 'Fichier inaccessible (' + reponseCours.status + ').'));
          return;
        }
        var resultat = course.analyserEtValiderCours(await reponseCours.text(), nomFichier);
        if (resultat.valide) {
          acceptes.push({ nomFichier: nomFichier, cours: resultat.cours });
        } else {
          rejetes.push({ nomFichier: nomFichier, erreurs: resultat.erreurs });
        }
      } catch (erreurLecture) {
        rejetes.push(creerRejet(nomFichier, 'Lecture impossible : ' + erreurLecture.message));
      }
    }));

    return { acceptes: acceptes, rejetes: rejetes };
  }

  /**
   * Ouvre le sélecteur de répertoire (règle COU-02). Rejette silencieusement (annule=true)
   * si l'utilisateur annule ; propage toute autre erreur.
   */
  function choisirRepertoire() {
    if (!apiRepertoireDisponible()) {
      return Promise.reject(Object.assign(new Error('API répertoire indisponible.'), { indisponible: true }));
    }
    return global.showDirectoryPicker({ mode: 'readwrite' }).catch(function (erreur) {
      if (erreur && (erreur.name === 'AbortError' || erreur.name === 'NotAllowedError')) {
        return Promise.reject(Object.assign(new Error('Sélection annulée ou refusée.'), { annule: true, cause: erreur }));
      }
      return Promise.reject(erreur);
    });
  }

  /**
   * Liste et valide les fichiers .json à la racine du répertoire (règle COU-03/04), sans récursion.
   */
  function listerCoursDuRepertoire(poigneeRepertoire) {
    var course = Memio.domain.course;
    var acceptes = [];
    var rejetes = [];
    var promesses = [];

    return (async function () {
      for await (var [nom, poignee] of poigneeRepertoire.entries()) {
        if (poignee.kind !== 'file' || !estFichierJson(nom)) {
          continue;
        }
        promesses.push(
          poignee
            .getFile()
            .then(function (fichier) {
              return fichier.text();
            })
            .then(function (texte) {
              var resultat = course.analyserEtValiderCours(texte, nom);
              if (resultat.valide) {
                acceptes.push({ nomFichier: nom, cours: resultat.cours });
              } else {
                rejetes.push({ nomFichier: nom, erreurs: resultat.erreurs });
              }
            })
            .catch(function (erreur) {
              rejetes.push({ nomFichier: nom, erreurs: [{ chemin: '', message: 'Lecture impossible : ' + erreur.message }] });
            })
        );
      }
      await Promise.all(promesses);
      return { acceptes: acceptes, rejetes: rejetes };
    })();
  }

  /**
   * Écrit un cours au format JSON dans le répertoire, en refusant d'écraser un fichier existant
   * (règle COU-09). Retourne { ecrit: true } ou { ecrit: false, motif }.
   */
  async function ecrireCoursDansRepertoire(poigneeRepertoire, nomFichier, cours) {
    try {
      var existeDeja = false;
      try {
        await poigneeRepertoire.getFileHandle(nomFichier, { create: false });
        existeDeja = true;
      } catch (erreurRecherche) {
        existeDeja = false;
      }
      if (existeDeja) {
        return { ecrit: false, motif: 'Un fichier "' + nomFichier + '" existe déjà dans le répertoire.' };
      }

      var poigneeFichier = await poigneeRepertoire.getFileHandle(nomFichier, { create: true });
      var flux = await poigneeFichier.createWritable();
      await flux.write(Memio.domain.course.serialiserCours(cours));
      await flux.close();
      return { ecrit: true };
    } catch (erreur) {
      return { ecrit: false, motif: "Échec de l'écriture : " + erreur.message };
    }
  }

  /**
   * Déclenche le téléchargement d'un cours au format JSON (repli manuel, règle COU-11).
   */
  function telechargerCours(nomFichier, cours) {
    var texte = Memio.domain.course.serialiserCours(cours);
    var blob = new global.Blob([texte], { type: 'application/json' });
    var url = global.URL.createObjectURL(blob);
    var lien = global.document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    global.document.body.appendChild(lien);
    lien.click();
    global.document.body.removeChild(lien);
    global.setTimeout(function () {
      global.URL.revokeObjectURL(url);
    }, 0);
  }

  Memio.services.files = {
    apiRepertoireDisponible: apiRepertoireDisponible,
    estFichierJson: estFichierJson,
    chargerCoursEmbarques: chargerCoursEmbarques,
    validerFichiersImportes: validerFichiersImportes,
    choisirRepertoire: choisirRepertoire,
    listerCoursDuRepertoire: listerCoursDuRepertoire,
    ecrireCoursDansRepertoire: ecrireCoursDansRepertoire,
    telechargerCours: telechargerCours
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
