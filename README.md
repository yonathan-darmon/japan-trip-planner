# 🗾 Japan Trip Planner

Application collaborative et intelligente pour planifier votre voyage de rêve au Japon. 

Ce projet permet à un groupe d'amis de proposer des activités, de voter pour leurs préférées, et de générer automatiquement un itinéraire optimisé géographiquement.

![Japan Trip Planner Banner](frontend/src/assets/banner-placeholder.png) 
*(Ajoutez une capture d'écran ici)*

## ✨ Fonctionnalités Principales

### 🗳️ Collaboration & Vote
- **Propositions d'activités** : Ajoutez des restaurants, temples, musées, ou lieux nature avec photos et descriptions.
- **Système de vote** : Chaque utilisateur vote pour ce qu'il veut faire ("Indispensable", "Si possible", "Bonus").
- **Catégories** : Organisation claire par type d'activité.

### 🤖 Génération d'Itinéraire Intelligente
- **Algorithme d'optimisation** : Regroupe les activités par proximité géographique pour minimiser les temps de trajet.
- **Adaptation automatique** : Crée un planning jour par jour équilibré.
- **Hébergement** : Suggère l'hôtel le plus proche de la zone d'activité du jour.

### 🗺️ Visualisation & Carte Interactive
- **Carte Leaflet intégrée** : Visualisez votre itinéraire jour par jour.
- **Marqueurs dynamiques** : Codes couleurs pour les activités et l'hébergement.
- **Visualisation Optimisée** : Tracés de couleurs distinctes par journée et zoom automatique.
- **Géocodage automatique** : Conversion automatique des adresses en coordonnées GPS (via Photon/Nominatim).

### ⏱️ Planification Réaliste
- **Temps de trajet** : Prise en compte automatique du temps de marche (~4km/h) entre chaque activité pour estimer la fin de journée.
- **Calcul de charge en temps réel** : La jauge de remplissage de la journée s'adapte instantanément lorsque vous déplacez des activités.

### 📅 Gestion Flexible de l'Itinéraire
- **Drag & Drop** : Déplacez facilement une activité d'un jour à l'autre.
- **Édition Rapide** : Changez l'hébergement ou l'ordre des visites en un clic.
- **Sécurité** : 
  - Chaque utilisateur gère ses propres itinéraires.
  - Mode **lecture seule** pour consulter les plannings des amis sans risque de modification.

## 🚀 Stack Technologique

### Frontend
- **Angular 17+** (Standalone Components, Signals)
- **Leaflet** & `leaflet-color-markers` pour la cartographie
- **Angular CDK** pour le Drag & Drop
- **CSS Moderne** (Glassmorphism, Variables CSS, Responsive)

### Backend
- **NestJS** (Framework Node.js progressif)
- **TypeORM** pour l'interaction avec la base de données
- **PostgreSQL** comme base de données principale
- **Passport/JWT** pour l'authentification sécurisée

### Services Externes
- **Scaleway Object Storage** (compatible S3) pour le stockage des photos
- **Nominatim / Photon** pour le géocodage open-source gratuit

## 🛠️ Installation et Démarrage

### Prérequis
- Node.js (v18+)
- PostgreSQL (v14+)
- Git

### 1. Configuration du Backend

```bash
cd backend

# Installation des dépendances
npm install

# Configuration de la base de données
# Copiez le fichier d'exemple et remplissez-le
cp .env.example .env

# Lancer le serveur en mode développement
npm run start:dev
```

Assurez-vous que votre base de données PostgreSQL est lancée et accessible via les identifiants fournis dans le `.env`.

### 2. Configuration du Frontend

```bash
cd frontend

# Installation des dépendances
npm install

# Lancer l'application
npm start
```

L'application sera accessible sur `http://localhost:4200`.

## ⚙️ Configuration (.env)

Exemple de variables nécessaires pour le backend :

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=japan_trip_db

# Auth
JWT_SECRET=super_secret_key_change_me

# Storage (S3 / Scaleway)
S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_REGION=fr-par
S3_BUCKET=votre_bucket
S3_ACCESS_KEY=votre_access_key
S3_SECRET_KEY=votre_secret_key
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une Issue ou une Pull Request.

## 📝 Licence

Ce projet est sous licence MIT.
