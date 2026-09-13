/**
 * Memio — domaine : moteur de quiz (voir doc/specifications-fonct/03-configuration.md et 04-quiz-et-bilan.md).
 * Aucune dépendance au DOM ; le hasard est injectable pour les tests (règle CFG-04/05).
 */
(function (global) {
  'use strict';

  var Memio = (global.Memio = global.Memio || {});
  Memio.domain = Memio.domain || {};

  /**
   * Construit le stock de questions à partir des entrées de catalogue sélectionnées.
   * Chaque item du stock porte une identité stable {nomFichier, index}.
   */
  function construireStock(entreesSelectionnees) {
    var stock = [];
    entreesSelectionnees.forEach(function (entree) {
      entree.cours.questions.forEach(function (question, index) {
        stock.push({
          nomFichierCours: entree.nomFichier,
          nomCours: entree.nom,
          index: index,
          question: question.question,
          reponse: question.reponse,
          explication: question.explication,
          theme: question.theme,
          difficulte: question.difficulte,
          tags: question.tags.slice()
        });
      });
    });
    return stock;
  }

  /**
   * Calcule le nombre effectif de questions tirées : N = min(demande, stock) — règle CFG-03.
   */
  function calculerQuantiteEffective(demande, tailleStock) {
    return Math.min(demande, tailleStock);
  }

  /**
   * Mélange de Fisher-Yates sur une copie du tableau. `rng` doit retourner un nombre dans [0, 1).
   */
  function melanger(tableau, rng) {
    var alea = rng || Math.random;
    var copie = tableau.slice();
    for (var i = copie.length - 1; i > 0; i -= 1) {
      var j = Math.floor(alea() * (i + 1));
      var temp = copie[i];
      copie[i] = copie[j];
      copie[j] = temp;
    }
    return copie;
  }

  /**
   * Tire `quantite` entrées distinctes et mélangées depuis le stock (règles CFG-04/05).
   */
  function tirerQuestions(stock, quantite, rng) {
    return melanger(stock, rng).slice(0, quantite);
  }

  /**
   * Crée l'état initial d'un quiz figé : questions tirées, mode auto-évaluation et progression à zéro.
   */
  function creerEtatQuiz(questionsTirees, autoEvaluationActivee) {
    return {
      autoEvaluationActivee: !!autoEvaluationActivee,
      indexCourant: 0,
      questions: questionsTirees.map(function (question) {
        return {
          question: question,
          revelee: false,
          evaluation: null // null | 'correct' | 'incorrect'
        };
      }),
      termine: false
    };
  }

  function question_(etat, index) {
    return etat.questions[index];
  }

  /**
   * Révèle la réponse de la question courante (ou de l'index donné) — règle QUI-02.
   */
  function revelerQuestion(etat, index) {
    var i = typeof index === 'number' ? index : etat.indexCourant;
    question_(etat, i).revelee = true;
    return etat;
  }

  /**
   * Enregistre ou remplace l'évaluation d'une question déjà révélée — règle EVA-01/02.
   * Ne fait rien si la question n'est pas révélée ou si l'auto-évaluation est désactivée.
   */
  function evaluerQuestion(etat, index, correcte) {
    var i = typeof index === 'number' ? index : etat.indexCourant;
    var q = question_(etat, i);
    if (!etat.autoEvaluationActivee || !q.revelee) {
      return etat;
    }
    q.evaluation = correcte ? 'correct' : 'incorrect';
    return etat;
  }

  /**
   * Déplace l'index courant vers une position donnée, sans jamais sortir des bornes.
   */
  function allerA(etat, index) {
    if (index < 0 || index >= etat.questions.length) {
      return etat;
    }
    etat.indexCourant = index;
    return etat;
  }

  function suivant(etat) {
    return allerA(etat, etat.indexCourant + 1);
  }

  function precedent(etat) {
    return allerA(etat, etat.indexCourant - 1);
  }

  /**
   * "Passer" : avance sans révéler ni évaluer la question courante (règle QUI-04).
   */
  function passer(etat) {
    return suivant(etat);
  }

  /**
   * Un quiz est complet si, selon le mode, toutes les réponses sont révélées
   * ou toutes les questions sont évaluées (règle FIN-01).
   */
  function estComplet(etat) {
    if (etat.autoEvaluationActivee) {
      return etat.questions.every(function (q) {
        return q.evaluation !== null;
      });
    }
    return etat.questions.every(function (q) {
      return q.revelee;
    });
  }

  /**
   * Calcule le bilan figé du quiz (règles BIL-01/02). N'a aucun effet de bord sur l'état.
   */
  function calculerBilan(etat) {
    var n = etat.questions.length;
    var nombreRevelees = etat.questions.filter(function (q) {
      return q.revelee;
    }).length;

    var bilan = {
      nombreQuestions: n,
      nombreRevelees: nombreRevelees,
      autoEvaluationActivee: etat.autoEvaluationActivee,
      questions: etat.questions.map(function (q) {
        return {
          question: q.question,
          revelee: q.revelee,
          evaluation: q.evaluation
        };
      })
    };

    if (etat.autoEvaluationActivee) {
      var correctes = etat.questions.filter(function (q) {
        return q.evaluation === 'correct';
      }).length;
      var incorrectes = etat.questions.filter(function (q) {
        return q.evaluation === 'incorrect';
      }).length;
      var evaluees = correctes + incorrectes;
      var nonEvaluees = n - evaluees;

      bilan.correctes = correctes;
      bilan.incorrectes = incorrectes;
      bilan.evaluees = evaluees;
      bilan.nonEvaluees = nonEvaluees;
      bilan.score = evaluees > 0 ? correctes / evaluees : null;
      bilan.pourcentage = evaluees > 0 ? Math.round((100 * correctes) / evaluees) : null;
    }

    return bilan;
  }

  Memio.domain.quiz = {
    construireStock: construireStock,
    calculerQuantiteEffective: calculerQuantiteEffective,
    melanger: melanger,
    tirerQuestions: tirerQuestions,
    creerEtatQuiz: creerEtatQuiz,
    revelerQuestion: revelerQuestion,
    evaluerQuestion: evaluerQuestion,
    allerA: allerA,
    suivant: suivant,
    precedent: precedent,
    passer: passer,
    estComplet: estComplet,
    calculerBilan: calculerBilan
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
