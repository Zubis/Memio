/**
 * Memio — orchestration de l'application (vues, événements, état en mémoire).
 * S'appuie uniquement sur Memio.domain.* et Memio.services.* déjà chargés.
 * Aucune donnée n'est transmise à un service externe.
 */
(function () {
  'use strict';

  var domaineCours = Memio.domain.course;
  var domaineCatalogue = Memio.domain.catalog;
  var domaineParametres = Memio.domain.settings;
  var domaineQuiz = Memio.domain.quiz;
  var servicePreferences = Memio.services.preferences;
  var serviceFichiers = Memio.services.files;

  // ---------------------------------------------------------------------
  // État applicatif en mémoire (aucune persistance hors préférences).
  // ---------------------------------------------------------------------
  var etat = {
    catalogue: [], // entrées { nomFichier, nom, description, nombreQuestions, cours, source, persiste }
    poigneeRepertoire: null,
    preferences: Object.assign({}, domaineParametres.VALEURS_INITIALES),
    quiz: null // { etatMoteur, coursSelectionnesNoms }
  };

  // ---------------------------------------------------------------------
  // Références DOM
  // ---------------------------------------------------------------------
  var el = {};
  [
    'zone-notifications',
    'info-compatibilite',
    'bouton-choisir-repertoire',
    'bouton-actualiser-repertoire',
    'formulaire-import',
    'champ-import',
    'compte-rendu-import',
    'etat-vide-catalogue',
    'liste-catalogue',
    'resume-selection',
    'resume-stock',
    'champ-quantite',
    'erreur-quantite',
    'avertissement-ajustement',
    'resume-auto-evaluation',
    'bouton-lancer-quiz',
    'vue-accueil',
    'vue-quiz',
    'vue-bilan',
    'progression-quiz',
    'navigation-numeros',
    'carte-question',
    'carte-recto',
    'carte-verso',
    'cours-origine-question',
    'texte-question',
    'cours-origine-question-verso',
    'texte-question-verso',
    'texte-reponse',
    'texte-explication',
    'texte-theme',
    'texte-difficulte',
    'texte-tags',
    'zone-evaluation',
    'bouton-correct',
    'bouton-incorrect',
    'bouton-precedent',
    'bouton-passer',
    'bouton-suivant',
    'bouton-terminer',
    'bouton-quitter',
    'resume-bilan',
    'liste-bilan',
    'bouton-retour-accueil',
    'bouton-prompt',
    'bouton-parametres',
    'modale-prompt',
    'texte-prompt',
    'bouton-copier-prompt',
    'bouton-fermer-prompt',
    'modale-parametres',
    'champ-parametre-quantite',
    'champ-parametre-auto-evaluation',
    'erreur-parametre-quantite',
    'avertissement-parametres',
    'bouton-enregistrer-parametres',
    'bouton-annuler-parametres',
    'modale-confirmation',
    'texte-modale-confirmation',
    'bouton-confirmer',
    'bouton-annuler-confirmation'
  ].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  // ---------------------------------------------------------------------
  // Notifications (GEN-04 : une erreur nomme l'opération, sa cause, l'action possible)
  // ---------------------------------------------------------------------
  function notifier(message, type) {
    var noeud = document.createElement('p');
    noeud.className = 'notification' + (type ? ' notification--' + type : '');
    noeud.textContent = message;
    el['zone-notifications'].appendChild(noeud);
    global_setTimeoutSupprimer(noeud);
  }

  function global_setTimeoutSupprimer(noeud) {
    setTimeout(function () {
      if (noeud.parentNode) {
        noeud.parentNode.removeChild(noeud);
      }
    }, 8000);
  }

  // ---------------------------------------------------------------------
  // Confirmation générique (modale <dialog>, focus géré nativement par showModal/close)
  // ---------------------------------------------------------------------
  function demanderConfirmation(texte, libelleConfirmer) {
    return new Promise(function (resolve) {
      el['texte-modale-confirmation'].textContent = texte;
      el['bouton-confirmer'].textContent = libelleConfirmer || 'Confirmer';

      function nettoyer(valeur) {
        el['bouton-confirmer'].removeEventListener('click', surConfirmer);
        el['bouton-annuler-confirmation'].removeEventListener('click', surAnnuler);
        el['modale-confirmation'].removeEventListener('close', surFermeture);
        resolve(valeur);
      }
      function surConfirmer() {
        el['modale-confirmation'].close();
      }
      function surAnnuler() {
        el['modale-confirmation'].close();
      }
      var confirme = false;
      function surClicConfirmer() {
        confirme = true;
        el['modale-confirmation'].close();
      }
      function surFermeture() {
        nettoyer(confirme);
      }

      el['bouton-confirmer'].addEventListener('click', surClicConfirmer);
      el['bouton-annuler-confirmation'].addEventListener('click', surAnnuler);
      el['modale-confirmation'].addEventListener('close', surFermeture);
      el['modale-confirmation'].showModal();
    });
  }

  // ---------------------------------------------------------------------
  // Préférences
  // ---------------------------------------------------------------------
  function chargerPreferencesInitiales() {
    var resultat = servicePreferences.chargerPreferences();
    etat.preferences = resultat.preferences;
    if (resultat.avertissement) {
      notifier(resultat.avertissement, 'info');
    }
  }

  function ouvrirModaleParametres() {
    el['champ-parametre-quantite'].value = String(etat.preferences.nombreQuestionsParDefaut);
    el['champ-parametre-auto-evaluation'].checked = etat.preferences.autoEvaluationActivee;
    el['erreur-parametre-quantite'].hidden = true;
    el['avertissement-parametres'].hidden = true;
    el['modale-parametres'].showModal();
  }

  function enregistrerParametres() {
    var validation = domaineParametres.validerNombreQuestions(el['champ-parametre-quantite'].value);
    if (!validation.valide) {
      el['erreur-parametre-quantite'].textContent = validation.message;
      el['erreur-parametre-quantite'].hidden = false;
      return;
    }
    var nouvellesPreferences = {
      nombreQuestionsParDefaut: validation.valeur,
      autoEvaluationActivee: el['champ-parametre-auto-evaluation'].checked
    };
    var resultat = servicePreferences.enregistrerPreferences(nouvellesPreferences);
    etat.preferences = nouvellesPreferences;
    el['champ-quantite'].value = String(nouvellesPreferences.nombreQuestionsParDefaut);
    rafraichirConfiguration();
    el['modale-parametres'].close();
    if (resultat.enregistre) {
      notifier('Paramètres enregistrés.', 'succes');
    } else {
      notifier(resultat.avertissement, 'info');
    }
  }

  // ---------------------------------------------------------------------
  // Prompt
  // ---------------------------------------------------------------------
  function ouvrirModalePrompt() {
    el['texte-prompt'].value = Memio.content.prompt.texte;
    el['modale-prompt'].showModal();
  }

  function copierPrompt() {
    var texte = el['texte-prompt'].value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(
        function () {
          notifier('Prompt copié dans le presse-papiers.', 'succes');
        },
        function () {
          proposerCopieManuelle();
        }
      );
    } else {
      proposerCopieManuelle();
    }
  }

  function proposerCopieManuelle() {
    el['texte-prompt'].focus();
    el['texte-prompt'].select();
    notifier(
      "Copie automatique impossible : le texte est sélectionné, utilisez le raccourci de copie de votre navigateur.",
      'info'
    );
  }

  // ---------------------------------------------------------------------
  // Catalogue : rendu
  // ---------------------------------------------------------------------
  function rendreCompatibilite() {
    el['info-compatibilite'].hidden = serviceFichiers.apiRepertoireDisponible();
    el['bouton-choisir-repertoire'].hidden = !serviceFichiers.apiRepertoireDisponible();
    el['bouton-actualiser-repertoire'].hidden = !(serviceFichiers.apiRepertoireDisponible() && etat.poigneeRepertoire);
  }

  function rendreCatalogue() {
    var liste = el['liste-catalogue'];
    liste.innerHTML = '';
    if (etat.catalogue.length === 0) {
      el['etat-vide-catalogue'].hidden = false;
      liste.hidden = true;
    } else {
      el['etat-vide-catalogue'].hidden = true;
      liste.hidden = false;
      etat.catalogue.forEach(function (entree, indexEntree) {
        liste.appendChild(construireCarteCours(entree, indexEntree));
      });
    }
    rafraichirConfiguration();
  }

  function construireCarteCours(entree, indexEntree) {
    var li = document.createElement('li');
    li.className = 'carte-cours';

    var idCase = 'case-cours-' + indexEntree;
    var label = document.createElement('label');
    var caseACocher = document.createElement('input');
    caseACocher.type = 'checkbox';
    caseACocher.id = idCase;
    caseACocher.checked = !!entree.selectionne;
    caseACocher.addEventListener('change', function () {
      entree.selectionne = caseACocher.checked;
      rafraichirConfiguration();
    });
    label.appendChild(caseACocher);
    label.appendChild(document.createTextNode(' '));

    var infos = document.createElement('span');
    infos.className = 'carte-cours__infos';
    infos.textContent =
      entree.nom + ' — ' + entree.description + ' (' + entree.nombreQuestions + ' questions, fichier ' + entree.nomFichier + ')';

    li.appendChild(label);
    li.appendChild(infos);

    if (!entree.persiste) {
      var badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Non enregistré dans le répertoire';
      li.appendChild(badge);

      var boutonTelecharger = document.createElement('button');
      boutonTelecharger.type = 'button';
      boutonTelecharger.className = 'bouton-secondaire';
      boutonTelecharger.textContent = 'Télécharger';
      boutonTelecharger.addEventListener('click', function () {
        serviceFichiers.telechargerCours(entree.nomFichier, entree.cours);
        notifier('Téléchargement demandé pour "' + entree.nomFichier + '".', 'info');
      });
      li.appendChild(boutonTelecharger);
    }

    return li;
  }

  // ---------------------------------------------------------------------
  // Configuration du quiz
  // ---------------------------------------------------------------------
  function entreesSelectionnees() {
    return etat.catalogue.filter(function (entree) {
      return entree.selectionne;
    });
  }

  function rafraichirConfiguration() {
    var selection = entreesSelectionnees();
    el['resume-selection'].textContent =
      selection.length === 0 ? 'aucun' : selection.map(function (e) { return e.nom; }).join(', ');

    var stock = domaineQuiz.construireStock(selection).length;
    el['resume-stock'].textContent = String(stock);
    el['resume-auto-evaluation'].textContent = etat.preferences.autoEvaluationActivee ? 'activée' : 'désactivée';

    var validationQuantite = domaineParametres.validerNombreQuestions(el['champ-quantite'].value);
    el['erreur-quantite'].hidden = validationQuantite.valide;
    if (!validationQuantite.valide) {
      el['erreur-quantite'].textContent = validationQuantite.message;
    }

    var ajustement = false;
    if (validationQuantite.valide && stock > 0 && validationQuantite.valeur > stock) {
      ajustement = true;
      el['avertissement-ajustement'].hidden = false;
      el['avertissement-ajustement'].textContent =
        'Seulement ' + stock + ' question' + (stock > 1 ? 's' : '') + ' disponible' + (stock > 1 ? 's' : '') +
        ' : le quiz portera sur ' + stock + ' question' + (stock > 1 ? 's' : '') + '.';
    } else {
      el['avertissement-ajustement'].hidden = true;
    }

    el['bouton-lancer-quiz'].disabled = !(selection.length > 0 && stock > 0 && validationQuantite.valide);
    return { selection: selection, stock: stock, validationQuantite: validationQuantite, ajustement: ajustement };
  }

  function lancerQuiz() {
    var contexte = rafraichirConfiguration();
    if (contexte.selection.length === 0 || !contexte.validationQuantite.valide || contexte.stock === 0) {
      return;
    }
    var stock = domaineQuiz.construireStock(contexte.selection);
    var quantiteEffective = domaineQuiz.calculerQuantiteEffective(contexte.validationQuantite.valeur, stock.length);
    var questionsTirees = domaineQuiz.tirerQuestions(stock, quantiteEffective, Math.random);
    var etatMoteur = domaineQuiz.creerEtatQuiz(questionsTirees, etat.preferences.autoEvaluationActivee);

    etat.quiz = {
      etatMoteur: etatMoteur,
      coursSelectionnesNoms: contexte.selection.map(function (e) { return e.nom; })
    };

    afficherVue('quiz');
    rendreQuiz();
  }

  // ---------------------------------------------------------------------
  // Navigation entre vues
  // ---------------------------------------------------------------------
  function afficherVue(nom) {
    el['vue-accueil'].hidden = nom !== 'accueil';
    el['vue-quiz'].hidden = nom !== 'quiz';
    el['vue-bilan'].hidden = nom !== 'bilan';
  }

  // ---------------------------------------------------------------------
  // Rendu du quiz
  // ---------------------------------------------------------------------
  function activerRevelation() {
    var m = etat.quiz.etatMoteur;
    var qEtat = m.questions[m.indexCourant];
    if (qEtat.revelee) {
      return;
    }
    domaineQuiz.revelerQuestion(m);
    rendreQuiz();
  }

  function rendreQuiz() {
    var m = etat.quiz.etatMoteur;
    var n = m.questions.length;
    var i = m.indexCourant;
    var qEtat = m.questions[i];
    var q = qEtat.question;

    var nbRevelees = m.questions.filter(function (x) { return x.revelee; }).length;
    var texteProgression = 'Question ' + (i + 1) + ' sur ' + n + ' — ' + nbRevelees + ' réponse' +
      (nbRevelees > 1 ? 's' : '') + ' révélée' + (nbRevelees > 1 ? 's' : '') + ' sur ' + n;
    if (m.autoEvaluationActivee) {
      var nbEvaluees = m.questions.filter(function (x) { return x.evaluation !== null; }).length;
      texteProgression += ' — ' + nbEvaluees + ' évaluée' + (nbEvaluees > 1 ? 's' : '') + ' sur ' + n;
    }
    el['progression-quiz'].textContent = texteProgression;

    rendreNavigationNumeros(m);

    el['cours-origine-question'].textContent = 'Cours : ' + q.nomCours;
    el['texte-question'].textContent = q.question;
    el['cours-origine-question-verso'].textContent = 'Cours : ' + q.nomCours;
    el['texte-question-verso'].textContent = q.question;

    el['carte-question'].classList.toggle('est-retournee', qEtat.revelee);
    el['carte-verso'].setAttribute('aria-hidden', qEtat.revelee ? 'false' : 'true');
    if (qEtat.revelee) {
      el['carte-recto'].setAttribute('aria-disabled', 'true');
      el['carte-recto'].removeAttribute('tabindex');
      el['carte-recto'].removeAttribute('role');
    } else {
      el['carte-recto'].setAttribute('role', 'button');
      el['carte-recto'].setAttribute('tabindex', '0');
      el['carte-recto'].removeAttribute('aria-disabled');
    }
    if (qEtat.revelee) {
      el['texte-reponse'].textContent = q.reponse;
      el['texte-explication'].textContent = q.explication;
      el['texte-theme'].textContent = q.theme;
      el['texte-difficulte'].textContent = q.difficulte;
      el['texte-tags'].textContent = q.tags.join(', ');
    }

    el['zone-evaluation'].hidden = !(m.autoEvaluationActivee && qEtat.revelee);

    el['bouton-precedent'].disabled = i === 0;
    el['bouton-suivant'].disabled = i === n - 1;
    el['bouton-passer'].disabled = i === n - 1;
  }

  function rendreNavigationNumeros(m) {
    var conteneur = el['navigation-numeros'];
    conteneur.innerHTML = '';
    m.questions.forEach(function (qEtat, index) {
      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.textContent = String(index + 1);
      bouton.setAttribute('aria-current', index === m.indexCourant ? 'true' : 'false');
      var classes = [];
      if (qEtat.revelee) classes.push('revelee');
      if (qEtat.evaluation === 'correct') classes.push('correct');
      if (qEtat.evaluation === 'incorrect') classes.push('incorrect');
      bouton.className = classes.join(' ');
      bouton.setAttribute(
        'aria-label',
        'Question ' + (index + 1) + (qEtat.revelee ? ', révélée' : ', non révélée') +
          (qEtat.evaluation ? ', ' + (qEtat.evaluation === 'correct' ? 'correcte' : 'incorrecte') : '')
      );
      bouton.addEventListener('click', function () {
        domaineQuiz.allerA(m, index);
        rendreQuiz();
      });
      conteneur.appendChild(bouton);
    });
  }

  async function terminerQuiz() {
    var m = etat.quiz.etatMoteur;
    if (!domaineQuiz.estComplet(m)) {
      var nbNonRevelees = m.questions.filter(function (x) { return !x.revelee; }).length;
      var texte = 'Il reste ' + nbNonRevelees + ' réponse' + (nbNonRevelees > 1 ? 's' : '') + ' non révélée' +
        (nbNonRevelees > 1 ? 's' : '') + '.';
      if (m.autoEvaluationActivee) {
        var nbNonEvaluees = m.questions.filter(function (x) { return x.evaluation === null; }).length;
        texte += ' ' + nbNonEvaluees + ' question' + (nbNonEvaluees > 1 ? 's' : '') + ' non évaluée' +
          (nbNonEvaluees > 1 ? 's' : '') + '.';
      }
      texte += ' Voulez-vous continuer le quiz ou le terminer quand même ?';
      var confirme = await demanderConfirmation(texte, 'Terminer quand même');
      if (!confirme) {
        return;
      }
    }
    afficherBilan();
  }

  async function quitterQuiz() {
    var confirme = await demanderConfirmation(
      'Quitter le quiz abandonne la progression : aucun bilan ne sera affiché. Continuer ?',
      'Quitter le quiz'
    );
    if (!confirme) {
      return;
    }
    etat.quiz = null;
    afficherVue('accueil');
  }

  function afficherBilan() {
    var m = etat.quiz.etatMoteur;
    var bilan = domaineQuiz.calculerBilan(m);

    var resume = el['resume-bilan'];
    var lignes = [];
    lignes.push('<p>Cours : ' + escaperHtml(etat.quiz.coursSelectionnesNoms.join(', ')) + '</p>');
    lignes.push('<p>Questions du quiz : ' + bilan.nombreQuestions + ' — réponses révélées : ' + bilan.nombreRevelees + '</p>');
    if (bilan.autoEvaluationActivee) {
      if (bilan.evaluees === 0) {
        lignes.push('<p>Aucune question évaluée.</p>');
      } else {
        lignes.push(
          '<p>Score (sur les questions évaluées uniquement, d\'après vos déclarations) : ' +
            bilan.correctes + ' / ' + bilan.evaluees + ' (' + bilan.pourcentage + ' %) — ' +
            bilan.nonEvaluees + ' non évaluée' + (bilan.nonEvaluees > 1 ? 's' : '') + '</p>'
        );
      }
    }
    resume.innerHTML = lignes.join('');

    var liste = el['liste-bilan'];
    liste.innerHTML = '';
    bilan.questions.forEach(function (item) {
      var li = document.createElement('li');
      var etatTexte = item.revelee
        ? item.evaluation
          ? item.evaluation === 'correct'
            ? 'correcte'
            : 'incorrecte'
          : 'révélée, non évaluée'
        : 'non traitée';
      var classeCouleur = '';
      if (bilan.autoEvaluationActivee) {
        if (item.evaluation === 'correct') {
          classeCouleur = 'etat-correct';
        } else if (item.evaluation === 'incorrect') {
          classeCouleur = 'etat-incorrect';
        } else {
          classeCouleur = 'etat-non-evaluee';
        }
      }
      var span = classeCouleur
        ? '<span class="' + classeCouleur + '">' + escaperHtml(etatTexte) + '</span>'
        : escaperHtml(etatTexte);
      li.innerHTML =
        '<strong>' + escaperHtml(item.question.nomCours) + '</strong> — ' + escaperHtml(item.question.question) +
        '<br>Réponse : ' + escaperHtml(item.question.reponse) +
        '<br>Explication : ' + escaperHtml(item.question.explication) +
        '<br>État : ' + span;
      liste.appendChild(li);
    });

    afficherVue('bilan');
  }

  function retourAccueil() {
    etat.quiz = null;
    etat.catalogue.forEach(function (entree) {
      entree.selectionne = false;
    });
    el['champ-quantite'].value = String(etat.preferences.nombreQuestionsParDefaut);
    rendreCatalogue();
    afficherVue('accueil');
  }

  // ---------------------------------------------------------------------
  // Utilitaire d'échappement HTML (GEN-05 : contenu importé affiché comme texte)
  // ---------------------------------------------------------------------
  function escaperHtml(texte) {
    var div = document.createElement('div');
    div.textContent = texte == null ? '' : String(texte);
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Import manuel de fichiers (COU-08)
  // ---------------------------------------------------------------------
  async function surImportFichiers(evenement) {
    var fichiers = evenement.target.files;
    if (!fichiers || fichiers.length === 0) {
      return;
    }
    el['champ-import'].disabled = true;
    try {
      var resultat = await serviceFichiers.validerFichiersImportes(fichiers);
      var ajoutes = [];
      var refusesConflit = [];

      for (var i = 0; i < resultat.acceptes.length; i += 1) {
        var accepte = resultat.acceptes[i];
        if (domaineCatalogue.contientNomFichier(etat.catalogue, accepte.nomFichier)) {
          refusesConflit.push(accepte.nomFichier);
          continue;
        }
        var persiste = false;
        if (etat.poigneeRepertoire) {
          var ecriture = await serviceFichiers.ecrireCoursDansRepertoire(
            etat.poigneeRepertoire,
            accepte.nomFichier,
            accepte.cours
          );
          persiste = ecriture.ecrit;
          if (!ecriture.ecrit) {
            notifier('Cours "' + accepte.nomFichier + '" non enregistré dans le répertoire : ' + ecriture.motif, 'info');
          }
        }
        var entree = domaineCatalogue.creerEntree(accepte.nomFichier, accepte.cours, 'import', persiste);
        etat.catalogue = domaineCatalogue.trierCatalogue(etat.catalogue.concat([entree]));
        ajoutes.push(accepte.nomFichier);
      }

      afficherCompteRenduImport(ajoutes, resultat.rejetes, refusesConflit);
      rendreCatalogue();
    } finally {
      el['champ-import'].disabled = false;
      el['champ-import'].value = '';
    }
  }

  function afficherCompteRenduImport(ajoutes, rejetes, refusesConflit) {
    var conteneur = el['compte-rendu-import'];
    if (ajoutes.length === 0 && rejetes.length === 0 && refusesConflit.length === 0) {
      conteneur.hidden = true;
      return;
    }
    var html = '';
    if (ajoutes.length > 0) {
      html += '<p>Cours ajoutés : ' + ajoutes.map(escaperHtml).join(', ') + '</p>';
    }
    if (refusesConflit.length > 0) {
      html += '<p>Refusés (nom de fichier déjà présent) : ' + refusesConflit.map(escaperHtml).join(', ') + '</p>';
    }
    if (rejetes.length > 0) {
      html += '<p>Fichiers rejetés :</p><ul>';
      rejetes.forEach(function (r) {
        html += '<li>' + escaperHtml(r.nomFichier) + ' : ' + r.erreurs.map(function (e) {
          return escaperHtml((e.chemin ? e.chemin + ' — ' : '') + e.message);
        }).join(' ; ') + '</li>';
      });
      html += '</ul>';
    }
    conteneur.innerHTML = html;
    conteneur.hidden = false;
  }

  async function chargerCoursEmbarquesAuDemarrage() {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
      return;
    }
    try {
      var resultat = await serviceFichiers.chargerCoursEmbarques('cours/index.json');
      if (resultat.acceptes.length > 0) {
        var entrees = resultat.acceptes.filter(function (a) {
          return !domaineCatalogue.contientNomFichier(etat.catalogue, a.nomFichier);
        }).map(function (a) {
          return domaineCatalogue.creerEntree(a.nomFichier, a.cours, 'embarque', true);
        });
        etat.catalogue = domaineCatalogue.trierCatalogue(etat.catalogue.concat(entrees));
      }
      afficherCompteRenduImport([], resultat.rejetes, []);
    } catch (erreur) {
      notifier('Chargement des cours embarqués impossible : ' + erreur.message, 'info');
    }
  }

  // ---------------------------------------------------------------------
  // Répertoire (COU-02 à COU-07, COU-09, COU-10)
  // ---------------------------------------------------------------------
  async function surChoisirRepertoire() {
    if (etat.catalogue.length > 0) {
      var confirme = await demanderConfirmation(
        'Choisir un autre répertoire remplacera le catalogue actuel. Les cours importés uniquement en ' +
          'mémoire (non enregistrés) seront perdus. Continuer ?',
        'Remplacer le catalogue'
      );
      if (!confirme) {
        return;
      }
    }

    var poignee;
    try {
      poignee = await serviceFichiers.choisirRepertoire();
    } catch (erreur) {
      if (erreur.annule) {
        return; // annulation : aucune erreur affichée (GEN-04)
      }
      notifier('Choix du répertoire impossible : ' + erreur.message, 'erreur');
      return;
    }

    etat.poigneeRepertoire = poignee;
    await chargerDepuisRepertoire(true);
  }

  async function chargerDepuisRepertoire(remplacementComplet) {
    el['bouton-actualiser-repertoire'].disabled = true;
    try {
      var resultat = await serviceFichiers.listerCoursDuRepertoire(etat.poigneeRepertoire);
      var nouvellesEntrees = resultat.acceptes.map(function (a) {
        return domaineCatalogue.creerEntree(a.nomFichier, a.cours, 'repertoire', true);
      });

      if (remplacementComplet) {
        etat.catalogue = domaineCatalogue.trierCatalogue(nouvellesEntrees);
      } else {
        var entreesImport = etat.catalogue.filter(function (e) { return e.source === 'import'; });
        etat.catalogue = domaineCatalogue.trierCatalogue(entreesImport.concat(nouvellesEntrees));
      }

      afficherCompteRenduImport([], resultat.rejetes, []);
      notifier('Répertoire actualisé : sélection réinitialisée.', 'info');
      rendreCompatibilite();
      rendreCatalogue();
    } catch (erreur) {
      notifier("Échec de l'actualisation du répertoire : le catalogue précédent est conservé. (" + erreur.message + ')', 'erreur');
    } finally {
      el['bouton-actualiser-repertoire'].disabled = false;
    }
  }

  function surActualiserRepertoire() {
    chargerDepuisRepertoire(false);
  }

  // ---------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------
  async function initialiser() {
    chargerPreferencesInitiales();
    rendreCompatibilite();

    el['champ-quantite'].value = String(etat.preferences.nombreQuestionsParDefaut);
    el['champ-quantite'].addEventListener('input', rafraichirConfiguration);
    el['bouton-lancer-quiz'].addEventListener('click', lancerQuiz);

    el['champ-import'].addEventListener('change', surImportFichiers);
    el['bouton-choisir-repertoire'].addEventListener('click', surChoisirRepertoire);
    el['bouton-actualiser-repertoire'].addEventListener('click', surActualiserRepertoire);

    el['carte-recto'].addEventListener('click', function () {
      activerRevelation();
    });
    el['carte-recto'].addEventListener('keydown', function (evenement) {
      if (evenement.key === 'Enter' || evenement.key === ' ' || evenement.key === 'Spacebar') {
        evenement.preventDefault();
        activerRevelation();
      }
    });
    el['bouton-correct'].addEventListener('click', function () {
      domaineQuiz.evaluerQuestion(etat.quiz.etatMoteur, undefined, true);
      rendreQuiz();
    });
    el['bouton-incorrect'].addEventListener('click', function () {
      domaineQuiz.evaluerQuestion(etat.quiz.etatMoteur, undefined, false);
      rendreQuiz();
    });
    el['bouton-precedent'].addEventListener('click', function () {
      domaineQuiz.precedent(etat.quiz.etatMoteur);
      rendreQuiz();
    });
    el['bouton-suivant'].addEventListener('click', function () {
      domaineQuiz.suivant(etat.quiz.etatMoteur);
      rendreQuiz();
    });
    el['bouton-passer'].addEventListener('click', function () {
      domaineQuiz.passer(etat.quiz.etatMoteur);
      rendreQuiz();
    });
    el['bouton-terminer'].addEventListener('click', terminerQuiz);
    el['bouton-quitter'].addEventListener('click', quitterQuiz);
    el['bouton-retour-accueil'].addEventListener('click', retourAccueil);

    el['bouton-prompt'].addEventListener('click', ouvrirModalePrompt);
    el['bouton-copier-prompt'].addEventListener('click', copierPrompt);
    el['bouton-fermer-prompt'].addEventListener('click', function () {
      el['modale-prompt'].close();
    });

    el['bouton-parametres'].addEventListener('click', ouvrirModaleParametres);
    el['bouton-enregistrer-parametres'].addEventListener('click', enregistrerParametres);
    el['bouton-annuler-parametres'].addEventListener('click', function () {
      el['modale-parametres'].close();
    });

    afficherVue('accueil');
    rendreCatalogue();

    await chargerCoursEmbarquesAuDemarrage();
    rendreCatalogue();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiser);
  } else {
    initialiser();
  }
})();
