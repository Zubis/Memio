'use strict';

const { test, expect } = require('@playwright/test');
const path = require('node:path');

/**
 * Vérifie l'ouverture directe via file:// (sans serveur), conformément au choix
 * confirmé "L'ouverture directe de index.html doit aussi être prise en charge".
 * L'import manuel doit fonctionner même sans hébergement HTTP.
 */
test('ouverture directe via file:// : import manuel fonctionnel', async ({ page }) => {
  const cheminIndex = path.join(__dirname, '..', '..', 'index.html');
  await page.goto('file://' + cheminIndex);

  await expect(page.locator('h1')).toHaveText('Memio');

  const fichier = path.join(__dirname, '..', 'fixtures', 'cours-geographie.json');
  await page.locator('#champ-import').setInputFiles([fichier]);
  await expect(page.locator('#liste-catalogue li')).toHaveCount(1);

  await page.locator('#liste-catalogue li input[type="checkbox"]').nth(0).check();
  await page.locator('#champ-quantite').fill('2');
  await page.getByRole('button', { name: 'Lancer le quiz' }).click();
  await expect(page.locator('#vue-quiz')).toBeVisible();
});

test('en file://, si l’API répertoire est indisponible, le repli manuel est expliqué (COU-12)', async ({ page }) => {
  const cheminIndex = path.join(__dirname, '..', '..', 'index.html');
  await page.goto('file://' + cheminIndex);

  const apiDisponible = await page.evaluate(() => typeof window.showDirectoryPicker === 'function');
  if (!apiDisponible) {
    await expect(page.locator('#info-compatibilite')).toBeVisible();
    await expect(page.locator('#bouton-choisir-repertoire')).toBeHidden();
  } else {
    await expect(page.locator('#bouton-choisir-repertoire')).toBeVisible();
  }
});
