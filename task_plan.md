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

## Phase Bonus : Mise à jour TVA & Catalogue (Fev 2026)
- [x] Modifier `AdminCatalogue.tsx` pour afficher le détail HT/TVA en temps réel.
- [x] Refactoriser `quote-engine.ts` pour synchroniser les calculs avec les dernières données du catalogue.
- [x] Mettre à jour `InvoiceEditor.tsx` pour ventiler automatiquement les formules sur 2 lignes de TVA (10% et 20%).
- [x] Injecter le catalogue dans `Wizard.tsx` et `AdminLeads.tsx` pour des calculs uniformes.
- [x] Vérifier la génération des PDF devis/facture avec les nouveaux calculs.

## Phase 6: Email Templates & Notifications Automatiques (Fev 2026)
- [x] Ajouter les champs de templates (Objet, Corps) dans `AppSettings`.
- [x] Créer l'interface d'édition des templates dans l'onglet SETTINGS du Dashboard Admin.
- [x] Intégrer les templates dynamiques dans l'envoi manuel d'e-mails (remplacement de `{{client_name}}`).
- [x] Ajouter la prise en charge des pièces jointes (Base64) dans `notifications.ts`.
- [x] Automatiser l'envoi de notifications internes avec pièce jointe lors de la validation client (Devis) et de la sauvegarde Admin (Facture).
