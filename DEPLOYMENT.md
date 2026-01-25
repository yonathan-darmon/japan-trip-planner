
# 🚀 Deployment Guide - Japan Trip Planner

This guide covers how to deploy the application to production using Docker and free/low-cost cloud providers.

## 📋 Prerequisites
- **Docker** and **Docker Compose** installed.
- **Node.js 20+** (if building locally).
- A **Scaleway** account (or any S3 provider) for image storage.
- A **PostgreSQL** database (Cloud or Local).

---

## 🐳 Docker Deployment (Recommended)

### 1. Build and Run with Docker Compose
We have a production-ready `docker-compose.yml`.

```bash
# 1. Create a production .env file
cp .env.example .env

# 2. Edit .env with your production secrets
# IMPORTANT: Change JWT_SECRET and Database credentials!

# 3. Build and Start
docker-compose up --build -d
```

The application will be available at:
- **Frontend**: http://localhost:4200 (or your domain)
- **Backend API**: http://localhost:3000

---

## ☁️ Cloud Hosting (Free Tier Friendly)

### Option A: Railway.app (Paid / Trial)
*Note: Railway is no longer fully free. They offer a $5 trial credit, then it costs ~$5/month.*
If you prefer a seamless experience and don't mind paying a small amount:
1. **Database**: Create a new PostgreSQL service on Railway.
2. **Backend**: Connect GitHub repo, set root to `/backend`.
3. **Frontend**: Connect GitHub repo, set root to `/frontend`, output to `dist/frontend/browser`.

### Option B: Render.com + Neon.tech (Recommended for 100% FREE)
**This is the best combination for a free forever project.**

**1. Database (Neon.tech - Best for Free Tier)**
Render's free PostgreSQL expires after 30 days. Use **Neon.tech** instead:
- Create a free account on [Neon.tech](https://neon.tech).
- Create a project.
- Get the Connection String (e.g., `postgres://user:pass@ep-xyz.aws.neon.tech/neondb...`).

**2. Backend (Render Web Service)**
- **Type**: Web Service (Free Tier).
- **Repo**: Connect your GitHub.
- **Root Directory**: `backend`.
- **Build Command**: `npm install && npm run build`.
- **Start Command**: `npm run start:prod`.
- **Env Vars**:
  - `DATABASE_HOST`: (From Neon) `ep-xyz.aws.neon.tech`
  - `DATABASE_URL`: (Full connection string from Neon, ensure `ssl=true` is appended if needed)
  - `JWT_SECRET`: (Your secret)
- **⚠️ Important Limitation**: The Free Tier "spins down" after 15 mins of inactivity. The first request after a break will take ~30-60s to load (Cold Start).

**3. Frontend (Render Static Site)**
- **Type**: Static Site (Free Tier).
- **Repo**: Connect your GitHub.
- **Root Directory**: `frontend`.
- **Build Command**: `npm install && npm run build`.
- **Publish Directory**: `dist/frontend/browser`.
- **Rewrites**: Add a Rewrite Rule: Source `/*` -> Destination `/index.html` (for Angular routing).

---

## 🗄️ Database Migrations

Use TypeORM to sync schema in production:

```bash
# Inside the backend container or shell
npm run typeorm:migration:run
```

*Note: `synchronize: true` is enabled by default in `app.module.ts`. For strict production safety, disable it and use migrations.*

## 🔒 Security Checklist
- [ ] Change `admin` password immediately after first login.
- [ ] Set `synchronize: false` in `TypeOrmModule` config.
- [ ] Use a strong `JWT_SECRET`.
- [ ] Enable HTTPS (handled automatically by Railway/Vercel).
