# Findings - Automatisations Admin

## État Actuel
- **Sauvegarde du Statut :** Directement géré par `handleStatusChange` qui met à jour l'état React (`draft`) mais ne persiste pas les données en base de données immédiatement. L'utilisateur doit cliquer sur "Enregistrer les modifications" (ou changer d'onglet) pour persister.
- **Bouton Facture :** La logique de la modale `InvoiceEditor` est présente dans `LeadEditor.tsx`, mais le bouton d'appel a été supprimé lors d'une précédente refonte de l'interface financière.
- **Logic de Facturation :** `InvoiceEditor` est déjà conçu pour s'initialiser avec les données de `quoteSelection`.

## Solutions Identifiées
- **Auto-save Statut :** Modifier `handleStatusChange` pour appeler explicitement `LeadStore.updateLead`.
- **Bouton Facture :** Réintroduire le bouton dans le bloc `Financial Summary` (le bloc or dégradé) pour une visibilité maximale.
- **Retour Utilisateur :** Utiliser le composant `<Alert />` existant pour confirmer la sauvegarde automatique du statut sans être trop intrusif.

## Mise à jour TVA & Catalogue (20/02/2026)
- **Calculs HT Dynamiques :** Les formules ont des parties HT fixes pour la TVA 10% et 20% dans le catalogue. Le moteur de calcul doit recalculer ces parts au prorata si un prix TTC personnalisé est appliqué.
- **Synchronisation Catalogue :** Les devis enregistrés stockent une "copie" de la formule au moment de l'enregistrement. Pour garantir que les modifications de prix du catalogue sont prises en compte (ex: changement du prix du champagne), le moteur de calcul a été modifié pour rafraîchir les données unitairement depuis le catalogue actuel si fourni.
- **Ventilation Facture :** La comptabilité exige une ventilation claire de la TVA. L'importation automatique du devis vers la facture sépare désormais chaque formule en deux lignes distinctes (une par taux de TVA) pour garantir l'exactitude des totaux fiscaux.
