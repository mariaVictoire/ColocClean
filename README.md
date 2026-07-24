# ColocClean

Web app de gestion automatique de la rotation du ménage en colocation (6 chambres).

Nom temporaire configurable dans `src/config/app.ts`.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** + **Prisma**
- **Auth.js (NextAuth v5)** — compte propriétaire
- Stockage photos abstrait (local / Cloudinary / Azure / S3)
- Vitest (tests unitaires)

## Architecture

```text
src/
  app/
    admin/                 # Espace propriétaire (protégé)
    api/                   # Routes API (auth, cron, validations…)
    (public pages Phase 4) # /app/chambre/...
  components/
  config/app.ts            # Nom de l'app, défauts
  lib/
    auth.ts / auth.config.ts
    db.ts
    scheduling/            # Rotation (Phase 3)
    storage/               # Abstraction photos
    security/
    validators/
prisma/
  schema.prisma
  seed.ts
```

## Prérequis

- Node.js **20.19+** recommandé (20.12+ fonctionne avec Prisma 6)
- Une base **PostgreSQL** (recommandé pour Vercel : [Neon](https://neon.tech) — pas besoin de Docker)
- npm

## Installation (dev local avec Neon — sans Docker)

```bash
# 1. Créer un projet gratuit sur https://console.neon.tech
# 2. Copier les 2 URLs : pooled → DATABASE_URL, directe → DIRECT_URL

npm install
cp .env.example .env
# Renseigner DATABASE_URL, DIRECT_URL, AUTH_SECRET

npx prisma migrate deploy
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Docker (`docker compose up -d`) reste optionnel si vous préférez Postgres en local.

## Identifiants de démonstration

| Champ        | Valeur                 |
| ------------ | ---------------------- |
| Email        | `owner@coloclean.demo` |
| Mot de passe | `DemoOwner123!`        |

Après le seed, les tokens QR des 6 chambres sont affichés dans la console.

## Scripts npm

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Serveur de développement             |
| `npm run build`   | Build production                     |
| `npm run start`   | Serveur production                   |
| `npm run lint`    | ESLint                               |
| `npm run test`    | Tests Vitest                         |
| `npm run db:migrate` | Migrations Prisma                 |
| `npm run db:seed` | Données de démonstration             |
| `npm run db:studio` | Prisma Studio                      |
| `npm run db:generate` | Génère le client Prisma          |

## Plan de développement

| Phase | Contenu |
| ----- | ------- |
| **1** | Init, Prisma, seed, auth ✅ |
| **2** | Dashboard, chambres, tâches, checklists |
| **3** | Algorithme de rotation + planning |
| **4** | QR codes + pages publiques + validation |
| **5** | WhatsApp + historique |
| **6** | Sécurité, tests, déploiement |

## Déploiement Vercel

Cible prévue : **Vercel + Neon** (PostgreSQL managé). Docker n’est pas nécessaire.

### 1. Base Neon

1. Créer un projet sur [neon.tech](https://neon.tech)
2. Dans *Connection details* :
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL` (requis pour `prisma migrate deploy`)

### 2. Projet Vercel

```bash
npm i -g vercel
vercel
```

Ou : importer le repo GitHub dans le dashboard Vercel.

### 3. Variables d’environnement (Vercel → Settings → Environment Variables)

| Variable | Exemple |
| -------- | ------- |
| `DATABASE_URL` | URL Neon *pooled* |
| `DIRECT_URL` | URL Neon *directe* |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://votre-app.vercel.app` |
| `CRON_SECRET` | secret aléatoire (crons Vercel) |
| `STORAGE_PROVIDER` | `cloudinary` ou `vercel-blob` (pas `local` en prod) |

Le script `build` exécute `prisma migrate deploy` puis `next build`.

### 4. Photos en production

Sur Vercel, le disque est **éphémère** : `STORAGE_PROVIDER=local` ne convient pas.
Prévoir Cloudinary ou Vercel Blob (Phase 4).

### 5. Crons (Phase 3)

Définis dans `vercel.json` :

- lundi 07:00 UTC → `/api/cron/generate-schedule`
- dimanche 18:05 UTC → `/api/cron/mark-late`

Les routes seront implémentées en Phase 3.

## Sécurité (MVP)

- Mots de passe hashés (bcrypt)
- Validation Zod
- Routes `/admin/*` protégées (middleware Auth.js)
- Tokens QR 64 caractères hex, non prédictibles
- Pas d’exposition des numéros WhatsApp côté public (Phase 4+)
