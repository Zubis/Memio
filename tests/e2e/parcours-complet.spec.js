'use strict';

const { test, expect } = require('@playwright/test');
const path = require('node:path');

const FICHIER_GEOGRAPHIE = path.join(__dirname, '..', 'fixtures', 'cours-geographie.json');
const FICHIER_HISTOIRE = path.join(__dirname, '..', 'fixtures', 'cours-histoire.json');
const FICHIER_INVALIDE = path.join(__dirname, '..', 'fixtures', 'cours-invalide.json');

/**
 * Parcours nominal (voir doc/specifications-fonct/README.md, "Parcours nominal") :
 * import de deux cours, sélection multiple, configuration, quiz avec auto-évaluation,
 * navigation libre, révélation, évaluation, fin explicite et bilan.
 */
test('parcours complet : import, sélection multi-cours, quiz avec auto-évaluation, bilan', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#liste-catalogue li')).toHaveCount(1);

  // Activation de l'auto-évaluation via les paramètres (PAR-02).
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.locator('#champ-parametre-auto-evaluation').check();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.locator('#resume-auto-evaluation')).toHaveText('activée');

  // Import de deux fichiers valides et un fichier invalide (AC-COU-01).
  await page.locator('#champ-import').setInputFiles([FICHIER_GEOGRAPHIE, FICHIER_HISTOIRE, FICHIER_INVALIDE]);
  await expect(page.locator('#compte-rendu-import')).toContainText('cours-geographie.json');
  await expect(page.locator('#compte-rendu-import')).toContainText('cours-invalide.json');
  await expect(page.locator('#liste-catalogue li')).toHaveCount(3);

  // Sélection des deux cours valides (CFG-01) : stock = 3 + 2 = 5 questions.
  await page.locator('#liste-catalogue li').filter({ hasText: 'cours-geographie.json' }).locator('input[type="checkbox"]').check();
  await page.locator('#liste-catalogue li').filter({ hasText: 'cours-histoire.json' }).locator('input[type="checkbox"]').check();
  await expect(page.locator('#resume-stock')).toHaveText('5');

  // Demande supérieure au stock : ajustement annoncé avant lancement (CFG-03).
  await page.locator('#champ-quantite').fill('10');
  await expect(page.locator('#avertissement-ajustement')).toContainText('Seulement 5 question');

  await page.getByRole('button', { name: 'Lancer le quiz' }).click();
  await expect(page.locator('#vue-quiz')).toBeVisible();
  await expect(page.locator('#progression-quiz')).toContainText('Question 1 sur 5');

  // La réponse est masquée avant révélation (QUI-01).
  await expect(page.locator('#carte-verso')).toHaveAttribute('aria-hidden', 'true');
  await page.getByRole('button', { name: 'Afficher la réponse' }).click();
  await expect(page.locator('#carte-verso')).toHaveAttribute('aria-hidden', 'false');

  // Évaluation puis remplacement (EVA-02).
  await page.getByRole('button', { name: "J'ai répondu correctement" }).click();
  await page.getByRole('button', { name: 'Je me suis trompé' }).click();

  // Navigation libre : passer, précédent (QUI-03/04).
  await page.getByRole('button', { name: 'Suivant' }).click();
  await expect(page.locator('#progression-quiz')).toContainText('Question 2 sur 5');
  await page.getByRole('button', { name: 'Précédent' }).click();
  await expect(page.locator('#progression-quiz')).toContainText('Question 1 sur 5');
  await expect(page.locator('#carte-verso')).toHaveAttribute('aria-hidden', 'false'); // état conservé (QUI-05)

  // Fin anticipée avec confirmation (FIN-02).
  await page.getByRole('button', { name: 'Terminer le quiz' }).click();
  await expect(page.locator('#modale-confirmation')).toBeVisible();
  await page.getByRole('button', { name: 'Terminer quand même' }).click();

  await expect(page.locator('#vue-bilan')).toBeVisible();
  await expect(page.locator('#resume-bilan')).toContainText('Questions du quiz : 5');

  // Retour aux cours : catalogue conservé, sélection réinitialisée (BIL-03/BIL-04).
  await page.getByRole('button', { name: 'Retour aux cours' }).click();
  await expect(page.locator('#vue-accueil')).toBeVisible();
  await expect(page.locator('#liste-catalogue li')).toHaveCount(3);
  await expect(page.locator('#resume-selection')).toHaveText('aucun');
});

test('un cours embarqué est disponible au démarrage et permet de lancer un quiz', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#liste-catalogue li')).toHaveCount(1);
  await expect(page.locator('#liste-catalogue')).toContainText('Préventions-des-risques-infectieux.json');

  await page.locator('#liste-catalogue li').filter({ hasText: 'Préventions-des-risques-infectieux.json' }).locator('input[type="checkbox"]').check();
  await expect(page.locator('#resume-stock')).not.toHaveText('0');
  await page.locator('#champ-quantite').fill('1');
  await page.getByRole('button', { name: 'Lancer le quiz' }).click();
  await expect(page.locator('#vue-quiz')).toBeVisible();
  await expect(page.locator('#progression-quiz')).toContainText('Question 1 sur 1');
});

test('sans auto-évaluation : aucun contrôle d’évaluation ni score (AC-EVA-01)', async ({ page }) => {
  await page.goto('/');
  await page.locator('#champ-import').setInputFiles([FICHIER_GEOGRAPHIE]);
  await page.locator('#liste-catalogue li').filter({ hasText: 'cours-geographie.json' }).locator('input[type="checkbox"]').check();
  await page.locator('#champ-quantite').fill('2');
  await page.getByRole('button', { name: 'Lancer le quiz' }).click();

  await page.getByRole('button', { name: 'Afficher la réponse' }).click();
  await expect(page.locator('#zone-evaluation')).toBeHidden();

  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Afficher la réponse' }).click();
  await page.getByRole('button', { name: 'Terminer le quiz' }).click();
  await expect(page.locator('#vue-bilan')).toBeVisible();
  await expect(page.locator('#resume-bilan')).not.toContainText('Score');
});

test('la modale du prompt est accessible depuis l’accueil (IA-01)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Voir / copier le prompt' }).click();
  await expect(page.locator('#modale-prompt')).toBeVisible();
  await expect(page.locator('#texte-prompt')).toHaveValue(/Format JSON attendu/);
  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.locator('#modale-prompt')).toBeHidden();
});

test('AC-GEN-04 : contenu HTML importé est affiché comme texte, jamais exécuté', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const donnees = {
      cours: '<img src=x onerror="window.__xss=true">',
      description: 'Test injection',
      questions: [
        {
          question: 'Q',
          reponse: 'R',
          explication: 'E',
          theme: 'T',
          difficulte: 'facile',
          tags: ['x']
        }
      ]
    };
    const fichier = new File([JSON.stringify(donnees)], 'xss.json', { type: 'application/json' });
    const conteneur = new DataTransfer();
    conteneur.items.add(fichier);
    document.getElementById('champ-import').files = conteneur.files;
    document.getElementById('champ-import').dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#liste-catalogue li').filter({ hasText: 'xss.json' })).toHaveCount(1);
  const xssDeclenche = await page.evaluate(() => window.__xss === true);
  expect(xssDeclenche).toBe(false);
});

test('la carte question se retourne au clavier (Entrée/Espace) et devient non interactive une fois révélée', async ({ page }) => {
  await page.goto('/');
  await page.locator('#champ-import').setInputFiles([FICHIER_GEOGRAPHIE]);
  await page.locator('#liste-catalogue li').filter({ hasText: 'cours-geographie.json' }).locator('input[type="checkbox"]').check();
  await page.locator('#champ-quantite').fill('1');
  await page.getByRole('button', { name: 'Lancer le quiz' }).click();

  const recto = page.locator('#carte-recto');
  await expect(recto).toHaveAttribute('role', 'button');
  await recto.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#carte-verso')).toHaveAttribute('aria-hidden', 'false');
  // Une fois révélée, la face recto n'est plus un élément interactif (pas de rôle actif).
  await expect(recto).not.toHaveAttribute('role', 'button');
});

test('le bilan colore les questions selon leur évaluation, uniquement si l’auto-évaluation était activée', async ({ page }) => {
  await page.goto('/');

  // Cas 1 : auto-évaluation activée -> couleurs appliquées.
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.locator('#champ-parametre-auto-evaluation').check();
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.locator('#champ-import').setInputFiles([FICHIER_GEOGRAPHIE]);
  await page.locator('#liste-catalogue li').filter({ hasText: 'cours-geographie.json' }).locator('input[type="checkbox"]').check();
  await page.locator('#champ-quantite').fill('2');
  await page.getByRole('button', { name: 'Lancer le quiz' }).click();

  await page.getByRole('button', { name: 'Afficher la réponse' }).click();
  await page.getByRole('button', { name: "J'ai répondu correctement" }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Afficher la réponse' }).click();
  await page.getByRole('button', { name: 'Je me suis trompé' }).click();
  await page.getByRole('button', { name: 'Terminer le quiz' }).click();

  await expect(page.locator('#liste-bilan .etat-correct')).toHaveCount(1);
  await expect(page.locator('#liste-bilan .etat-incorrect')).toHaveCount(1);

  await page.getByRole('button', { name: 'Retour aux cours' }).click();

  // Cas 2 : auto-évaluation désactivée -> aucune couleur.
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.locator('#champ-parametre-auto-evaluation').uncheck();
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.locator('#liste-catalogue li input[type="checkbox"]').nth(0).check();
  await page.locator('#champ-quantite').fill('2');
  await page.getByRole('button', { name: 'Lancer le quiz' }).click();
  await page.getByRole('button', { name: 'Afficher la réponse' }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Afficher la réponse' }).click();
  await page.getByRole('button', { name: 'Terminer le quiz' }).click();

  await expect(page.locator('#liste-bilan .etat-correct')).toHaveCount(0);
  await expect(page.locator('#liste-bilan .etat-incorrect')).toHaveCount(0);
  await expect(page.locator('#liste-bilan .etat-non-evaluee')).toHaveCount(0);
});
