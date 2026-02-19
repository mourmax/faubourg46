# Progress - Automatisations Admin

## 2026-02-18
- [x] Initialisation de la mémoire projet (`task_plan.md`, `findings.md`).
- [x] Analyse du code source de `LeadEditor.tsx`, `AdminLeads.tsx` et `InvoiceEditor.tsx`.
- [x] Implémentation de la sauvegarde automatique du statut.
- [x] Restauration du bouton "Transformer en Facture".
- [x] Vérification du fonctionnement global.

## 2026-02-19
- [x] Ajout du détail HT/TVA/TTC dans le catalogue admin (`AdminCatalogue.tsx`).
- [x] Refactorisation du moteur de calcul (`quote-engine.ts`) pour synchronisation avec le catalogue.
- [x] Mise à jour de la génération PDF pour refléter les prix du catalogue.
- [x] Amélioration de l'initialisation des factures avec ventilation automatique de la TVA (10%/20%) pour les formules.
- [x] Passage des données du catalogue dans toute la chaîne de calcul (Dashboard -> LeadEditor/AdminLeads/Wizard -> Summary).
