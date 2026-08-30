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

## Installation (dev avec Supabase — sans Docker)

```bash
# 1. Créer un projet gratuit sur https://supabase.com/dashboard
# 2. Project Settings → Database → Connection string :
#    - Transaction (port 6543) → DATABASE_URL (+ ?pgbouncer=true)
#    - Direct (port 5432)      → DIRECT_URL
# 3. Mot de passe DB = celui choisi à la création du projet

npm install
cp .env.example .env
# Renseigner DATABASE_URL, DIRECT_URL, AUTH_SECRET
# AUTH_URL=http://localhost:3000 (ou le port affiché par next dev)

npx prisma migrate deploy
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Alternatives : [Neon](https://neon.tech) (mêmes variables) ou Docker (`docker compose up -d`) pour Postgres local.

## Identifiants de démonstration

| Champ        | Valeur                 |
| ------------ | ---------------------- |
| Email Arnold | `arnold@coloclean.com` |
| MDP Arnold   | `arnoldDemo123§`       |
| Email Ralph  | `ralph@coloclean.com`  |
| MDP Ralph    | `ralphDemo123`         |

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
| **2** | Dashboard, chambres, tâches, checklists ✅ |
| **3** | Algorithme de rotation + planning + crons ✅ |
| **4** | QR codes + pages publiques + validation ✅ |
| **5** | WhatsApp + historique ✅ |
| **6** | Sécurité, tests, déploiement ✅ |

### Parcours utiles

- Admin : `/admin` (après connexion)
- QR locataire : `/app/chambre/chambre-N/<token>` (tokens affichés au seed)
- Cron (header `Authorization: Bearer $CRON_SECRET`) :
  - `GET /api/cron/generate-schedule`
  - `GET /api/cron/mark-late`

## Déploiement Vercel

Cible prévue : **Vercel + Supabase** (ou Neon). Docker n’est pas nécessaire.

### 1. Base Supabase (ou Neon)

1. Créer un projet sur [supabase.com](https://supabase.com/dashboard) (ou [neon.tech](https://neon.tech))
2. Dans *Project Settings → Database → Connection string* :
   - **Transaction pooler** (port `6543`) → `DATABASE_URL` (ajouter `?pgbouncer=true`)
   - **Direct connection** (port `5432`) → `DIRECT_URL` (requis pour `prisma migrate deploy`)

### 2. Projet Vercel

```bash
npm i -g vercel
vercel
```

Ou : importer le repo GitHub dans le dashboard Vercel.

### 3. Variables d’environnement (Vercel → Settings → Environment Variables)

| Variable | Exemple |
| -------- | ------- |
| `DATABASE_URL` | URL Supabase *Transaction* (`:6543` + `?pgbouncer=true`) |
| `DIRECT_URL` | URL Supabase *Direct* (`db.…supabase.co:5432`) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://votre-app.vercel.app` |
| `CRON_SECRET` | secret aléatoire (crons Vercel) |
| `STORAGE_PROVIDER` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé **service_role** (Settings → API) — ne jamais exposer côté client |

Le script `build` exécute `prisma migrate deploy` puis `next build`.

Après le premier déploiement, mets à jour `AUTH_URL` avec l’URL Vercel réelle, puis redeploy.

### 4. Photos (Supabase Storage + lien WhatsApp)

WhatsApp web **ne peut pas** joindre une photo automatiquement. ColocClean :
1. enregistre la photo dans **Supabase Storage**
2. ouvre WhatsApp avec un message contenant le **lien** de la photo
3. affiche aussi la photo dans Admin → Historique

Créer le bucket : automatique au premier upload (bucket public `validation-photos`), ou manuellement dans Supabase → Storage.

### 5. Crons (Phase 3)

Définis dans `vercel.json` :

- lundi 07:00 UTC → `/api/cron/generate-schedule`
- dimanche 18:05 UTC → `/api/cron/mark-late`

Les routes sont protégées par `CRON_SECRET`.

## Sécurité (MVP)

- Mots de passe hashés (bcrypt)
- Validation Zod
- Routes `/admin/*` protégées (middleware Auth.js)
- Tokens QR 64 caractères hex, non prédictibles
- Pas d’exposition des numéros WhatsApp côté public (Phase 4+)
