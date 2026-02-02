# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [Unreleased]

### 🚀 Fonctionnalités
- **Itinéraire** : Amélioration majeure de l'algorithme de génération d'itinéraire.
  - Le seuil de clustering a été réduit de 100km à 50km pour des regroupements plus pertinents.
  - Recherche d'hébergement limitée à 30km autour des activités.
  - **Support des jours sans hébergement** : Si aucun hôtel n'est proche, le champ reste vide (affiché avec une alerte ⚠️ sur l'interface).
  - Suppression du remplissage automatique ("Forward/Backward fill") des hôtels pour éviter des assignations irréalistes.
  - Ajout d'une **phase d'optimisation finale** qui regroupe les jours par hôtel commun et par proximité géographique.

### 🎨 Interface Utilisateur
- **Visualisation des Itinéraires** :
  - Ajout d'indicateurs visuels (bordure orange, icône) pour les jours sans hébergement défini.
  - Remplacement du bouton d'édition par un bouton "Ajouter" (+) lorsque l'hébergement est manquant.
  - Message clair "Zone inconnue" pour inciter l'utilisateur à agir.

### ⚙️ Technique
- Création du `OptimizationService` pour gérer la logique de réorganisation des jours.
- Refactoring `ItineraryService` pour intégrer ces nouvelles contraintes.
- Ajout de diagrammes explicatifs dans le README.
