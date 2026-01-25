# 🗾 Japan Trip Planner

Application collaborative de planification de voyage au Japon avec gestion intelligente d'itinéraires.

## 🚀 Stack Technologique

- **Frontend**: Angular (dernière version)
- **Backend**: NestJS avec TypeScript
- **Base de données**: PostgreSQL
- **Stockage images**: Scaleway Object Storage (S3-compatible)
- **Géocodage**: Nominatim API (OpenStreetMap) - 100% gratuit
- **Optimisation**: Google OR-Tools (open source)

## ✨ Fonctionnalités

### Authentification
- Connexion avec username/password
- Rôles: Super Admin et Utilisateur Standard
- Gestion des utilisateurs (Super Admin uniquement)

### Suggestions d'Activités
- Création de suggestions avec photo, nom, lieu, description, prix, catégorie
- Modification par le créateur
- Suppression par Super Admin uniquement
- Filtres par catégorie et prix

### Préférences Utilisateurs
- Sélection des activités souhaitées
- Niveaux de priorité: Indispensable, Si Possible, Bonus
- Mode solo ou groupe pour chaque activité

### Génération d'Itinéraire Intelligent
- Optimisation géographique avec Google OR-Tools (TSP)
- Prise en compte des priorités et préférences
- Calcul automatique des coûts
- Modification manuelle (drag & drop)
- Sauvegarde de plusieurs plans

### Configuration du Voyage
- Durée modifiable (3 semaines par défaut)
- Dates de début/fin
- Dates fixes pour certaines activités

## 📁 Structure du Projet

```
japan-trip-planner/
├── frontend/          # Application Angular
├── backend/           # API NestJS
├── docker-compose.yml # Configuration Docker
└── README.md
```

## 🛠️ Installation et Lancement

### Prérequis
- Node.js 18+
- Docker et Docker Compose
- npm ou yarn

### Développement Local

1. **Cloner le projet**
```bash
git clone <repository-url>
cd japan-trip-planner
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

3. **Lancer la base de données**
```bash
docker-compose up -d postgres
```

4. **Lancer le backend**
```bash
cd backend
npm install
npm run start:dev
```

5. **Lancer le frontend**
```bash
cd frontend
npm install
npm start
```

6. **Accéder à l'application**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api

## 🎨 Design

- Dark mode moderne
- Design responsive (mobile + web)
- Glassmorphism et animations
- Interface en français

## 📦 Déploiement

### Hébergement Recommandé (Gratuit)
- **Frontend**: Vercel ou Netlify
- **Backend**: Railway.app ou Render.com
- **Base de données**: Railway PostgreSQL ou Supabase
- **Images**: Scaleway Object Storage (75GB gratuit)

## 📝 License

MIT
