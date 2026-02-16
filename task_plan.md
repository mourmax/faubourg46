# Task Plan - Ajout des champs Société dans l'Admin

## Phase 1: Blueprint
- [x] Vérifier l'existence des champs dans `types.ts` (Sont déjà présents).
- [x] Confirmer le schéma de données dans `gemini.md`.
- [x] Planifier l'UI dans `LeadEditor.tsx`.

## Phase 2: Link
- [x] Vérifier l'accès aux fichiers locaux (Fait).

## Phase 3: Architect
- [x] Modifier `src/components/LeadEditor.tsx` :
    - [x] Ajouter le champ "Adresse de la société" (`address`).
    - [x] Ajouter le champ "Numéro de TVA" (`vatNumber`).
    - [x] Ajouter le champ "Référence interne / N° de commande" (`internalRef`).
    - [x] Réorganiser la grille pour une meilleure lisibilité.

## Phase 4: Stylize
- [x] Assurer la cohérence visuelle avec le design "premium" actuel.
- [x] Vérifier que les placeholders et labels sont clairs.

## Phase 5: Trigger
- [x] Vérification finale avec l'utilisateur.
- [x] Mise à jour de `progress.md`.
- [x] Commit et Push Git.
