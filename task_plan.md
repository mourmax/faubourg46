# Task Plan - Ajout des champs Société dans l'Admin

## Phase 1: Blueprint
- [x] Vérifier l'existence des champs dans `types.ts` (Sont déjà présents).
- [ ] Confirmer le schéma de données dans `gemini.md`.
- [ ] Planifier l'UI dans `LeadEditor.tsx`.

## Phase 2: Link
- [x] Vérifier l'accès aux fichiers locaux (Fait).

## Phase 3: Architect
- [ ] Modifier `src/components/LeadEditor.tsx` :
    - [ ] Ajouter le champ "Adresse de la société" (`address`).
    - [ ] Ajouter le champ "Numéro de TVA" (`vatNumber`).
    - [ ] Ajouter le champ "Référence interne / N° de commande" (`internalRef`).
    - [ ] Réorganiser la grille pour une meilleure lisibilité.

## Phase 4: Stylize
- [ ] Assurer la cohérence visuelle avec le design "premium" actuel.
- [ ] Vérifier que les placeholders et labels sont clairs.

## Phase 5: Trigger
- [ ] Vérification finale avec l'utilisateur.
- [ ] Mise à jour de `progress.md`.
