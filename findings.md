# Findings - Structure de données Contacts

## Architecture
- Les données de contact sont centralisées dans l'objet `contact` de l'interface `QuoteSelection`.
- Les champs `address`, `vatNumber`, et `internalRef` étaient déjà présents dans le type TypeScript mais n'étaient pas exposés dans l'interface d'édition Admin (`LeadEditor.tsx`), bien qu'ils le soient dans le parcours public (`StepContact.tsx`).
- Les composants de génération PDF (`PdfDocument.tsx` et `InvoicePdfDocument.tsx`) ont été conçus pour afficher conditionnellement ces champs si ils sont renseignés.

## Constats
L'ajout de ces champs dans l'interface Admin complète le flux de travail B2B, permettant aux gestionnaires de corriger ou de compléter les détails de facturation avant la génération finale du devis ou de la facture.
