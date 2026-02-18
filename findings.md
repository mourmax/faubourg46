# Findings - Automatisations Admin

## État Actuel
- **Sauvegarde du Statut :** Directement géré par `handleStatusChange` qui met à jour l'état React (`draft`) mais ne persiste pas les données en base de données immédiatement. L'utilisateur doit cliquer sur "Enregistrer les modifications" (ou changer d'onglet) pour persister.
- **Bouton Facture :** La logique de la modale `InvoiceEditor` est présente dans `LeadEditor.tsx`, mais le bouton d'appel a été supprimé lors d'une précédente refonte de l'interface financière.
- **Logic de Facturation :** `InvoiceEditor` est déjà conçu pour s'initialiser avec les données de `quoteSelection`.

## Solutions Identifiées
- **Auto-save Statut :** Modifier `handleStatusChange` pour appeler explicitement `LeadStore.updateLead`.
- **Bouton Facture :** Réintroduire le bouton dans le bloc `Financial Summary` (le bloc or dégradé) pour une visibilité maximale.
- **Retour Utilisateur :** Utiliser le composant `<Alert />` existant pour confirmer la sauvegarde automatique du statut sans être trop intrusif.
