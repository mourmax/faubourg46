# Progress - Ajout des champs Société dans l'Admin

## Ce qui a été fait
- Mise à jour du `task_plan.md` pour refléter la tâche actuelle.
- Mise à jour de `gemini.md` pour documenter le schéma `contact` complet.
- Modification de `src/components/LeadEditor.tsx` pour inclure les nouveaux champs dans l'onglet "Coordonnées" :
    - Adresse de la société
    - Numéro de TVA
    - Référence interne / N° de commande
- Vérification que la génération PDF (`PdfDocument` et `InvoicePdfDocument`) supporte déjà l'affichage de ces champs.

## Résultats
L'administrateur peut maintenant saisir et modifier les informations B2B d'un devis directement depuis le dashboard. Ces informations seront automatiquement répercutées sur les devis PDF générés.

## Prochaines étapes
- Attendre le retour de l'utilisateur pour d'éventuels ajustements visuels.
