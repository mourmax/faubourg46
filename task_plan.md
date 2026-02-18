# Task Plan - Automatisations et Facturation Admin

## Phase 1: Blueprint
- [x] Analyser `LeadEditor.tsx` pour l'intégration de la sauvegarde automatique du statut.
- [x] Identifier l'emplacement optimal pour le bouton "Transformer en Facture".
- [x] Vérifier que `InvoiceEditor.tsx` est prêt à recevoir les données du devis.

## Phase 2: Link
- [x] Confirmer les imports Lucide icons nécessaires (`FilePlus`, `FileEdit`).

## Phase 3: Architect
- [x] Modifier `src/components/LeadEditor.tsx` :
    - [x] Mettre à jour `handleStatusChange` pour inclure une sauvegarde automatique via `LeadStore`.
    - [x] Ajouter le bouton "Transformer en Facture" (si pas de facture) ou "Modifier la Facture" (si facture existante) dans le panneau latéral financier.
    - [x] S'assurer que le bouton déclenche l'affichage de la modale `InvoiceEditor`.

## Phase 4: Stylize
- [x] Utiliser les classes CSS existantes (`gold-gradient`, `glass-card`, etc.) pour maintenir le design premium.
- [x] Ajouter des retours visuels (Alert) lors de la sauvegarde automatique du statut.

## Phase 5: Trigger
- [x] Tester le changement de statut et vérifier la persistance en base (Appwrite).
- [x] Tester la transformation d'un devis en facture et la génération du PDF.
- [x] Finaliser le `progress.md`.

