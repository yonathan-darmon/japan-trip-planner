# 🗾 Japan Trip Planner - Guide d'Installation

## ⚠️ Problème avec Docker ?

Si vous avez l'erreur **"Virtualization support not detected"** avec Docker Desktop, cela signifie que la virtualisation est désactivée dans le BIOS de votre ordinateur.

**✅ RECOMMANDE : Passez directement à l'OPTION 1 (Installation Locale)** ci-dessous. C'est plus simple et ne nécessite pas de modifier le BIOS.

---

## 1. Prérequis

Avant de commencer, installez ces logiciels :

### A. Node.js & npm
1. Télécharger **Node.js (LTS)** : https://nodejs.org/
2. Installer (tout laisser par défaut)
3. Vérifier dans un terminal (PowerShell) :
   ```powershell
   node --version
   npm --version
   ```

### B. PostgreSQL (Installation Locale - SANS DOCKER)
1. Télécharger **PostgreSQL pour Windows** : https://www.postgresql.org/download/windows/
2. Lancer l'installateur
3. **IMPORTANT - Pendant l'installation (notez bien ces infos) :**
   - **Superuser password** : écrivez `postgres` (ou un mot de passe que vous retiendrez)
   - **Port** : laissez `5432` par défaut
   - **Locale** : laissez par défaut
4. À la fin, décochez "Stack Builder", ce n'est pas nécessaire.
5. Vérifier que ça marche en ouvrant l'application **pgAdmin 4** (installée avec) ou via terminal :
   ```powershell
   psql -U postgres
   # (Entrez le mot de passe défini à l'étape 3)
   ```

### C. Git (Optionnel)
- https://git-scm.com/download/win

---

## 2. Configuration du Projet

### A. Récupérer le projet
Si ce n'est pas fait :
```powershell
cd C:\Users\yonid\.gemini\antigravity\scratch\japan-trip-planner
```

### B. Variables d'Environnement (.env)
1. Créer le fichier `.env` s'il n'existe pas :
   ```powershell
   copy .env.example .env
   ```
2. Ouvrir le fichier `.env` :
   ```powershell
   notepad .env
   ```
3. **Modifiez les lignes suivantes** pour qu'elles correspondent à votre installation PostgreSQL locale :
   ```ini
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres  # <--- METTEZ LE MOT DE PASSE DÉFINI LORS DE L'INSTALLATION
   DATABASE_NAME=japan_trip_planner
   ```
   *(Si vous avez mis un autre mot de passe que "postgres", changez-le ici !)*

### C. Configuration Stockage Images (Plus tard)
Pour l'instant, vous pouvez laisser les clés `SCALEWAY_` par défaut. L'upload d'images ne fonctionnera pas, mais le reste oui.
Pour activer les images plus tard :
1. Créez un compte sur [Scaleway.com](https://www.scaleway.com)
2. Créez un Bucket Object Storage
3. Générez une clé API et remplissez les variables `SCALEWAY_` dans `.env`

---

## 3. Installation des Dépendances

Ouvrez **deux terminaux PowerShell**.

**Terminal 1 (Backend) :**
```powershell
cd backend
npm install
```

**Terminal 2 (Frontend) :**
```powershell
cd frontend
npm install
```

---

## 4. Lancement de l'Application

Il faut toujours lancer **d'abord la base de données (déjà lancée si installée localement)**, **puis le backend**, **puis le frontend**.

**Terminal 1 (Backend) :**
```powershell
# Assurez-vous d'être dans le dossier backend
npm run start:dev
```
*Attendez de voir : `Application is running on: http://localhost:3000/api`*

**Terminal 2 (Frontend) :**
```powershell
# Assurez-vous d'être dans le dossier frontend
npm start
```

---

## 5. Accès à l'Application

Ouvrez votre navigateur sur : **http://localhost:4200**

- **Utilisateur Super Admin** (créé automatiquement) :
  - User: `admin`
  - Pass: `AdminPassword123!`

---

## ❓ Dépannage Rapide

### Ports Utilisés
- **3000** : Backend API
- **4200** : Frontend Angular
- **5432** : Base de données PostgreSQL

### Erreur "Connection refused" (Backend)
Vérifiez que votre mot de passe dans `.env` correspond exactement à celui choisi lors de l'installation de PostgreSQL.

### Comment arrêter ?
Dans les terminaux, faites `Ctrl + C` pour stopper les serveurs.
