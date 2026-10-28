# OrientCompanion - Backend REST API (Moroccan Orientation Platform)

> **Plateforme marocaine d'orientation académique et professionnelle post-bac & prépa concours.**  
> *Portage complet et moderne vers Express.js / Node.js & Prisma ORM avec calculs algorithmiques rigoureux, pipeline de recommandation hybride, planificateur de notes cibles et compagnon de préparation aux concours.*

---

## 📑 Sommaire / Table of Contents
1. [English Guide](#english-guide)
   - [Tech Stack](#tech-stack)
   - [System Architecture](#system-architecture)
   - [Local Setup & Getting Started](#local-setup--getting-started)
   - [Test Accounts](#seed-test-accounts)
   - [Running Unit Tests](#running-unit-tests)
   - [API Documentation (Swagger)](#api-documentation)
2. [Guide en Français](#guide-en-français)
   - [Technologies utilisées](#technologies-utilisées)
   - [Installation locale étape par étape](#installation-locale-étape-par-étape)
   - [Comptes de test pré-configurés](#comptes-de-test)
   - [Exécution des tests unitaires](#tests-unitaires)

---

# English Guide

## Tech Stack
- **Runtime & Framework**: Node.js 20 LTS, Express 4 with ES Modules (`"type": "module"`).
- **Database & ORM**: MySQL 8 with Prisma ORM. No Docker, runs on local MySQL.
- **Authentication**: JWT (`jsonwebtoken`) with 15-minute access token and 7-day refresh token rotation; `bcrypt` for password hashing.
- **Validation**: Reusable `validate` middleware with `zod` for `body`, `params`, and `query`.
- **Security**: `helmet`, `cors` (origin from env), `express-rate-limit` on `/auth` routes only.
- **API Documentation**: OpenAPI 3.0 specification using `swagger-jsdoc` and `swagger-ui-express` at `/api/docs`.
- **File Uploads**: `multer` storing files locally in `./uploads` with 5 MB limit (PDF, JPG, PNG).
- **Email & Scheduling**: `nodemailer` (console transport in dev) + `node-cron` for automated background jobs.
- **LLM Integration**: Google Gemini API (`@google/generative-ai`) behind a strict `LlmClient` wrapper.
  > **Strict Design Rule**: All numeric calculations (scoring, grade planner, exam marks, similarity) are done in pure JavaScript code. The LLM is ONLY used to write natural-language explanations in French from numbers already computed.

---

## System Architecture

```
src/
├── config/             # env.js (Zod validated), prisma.js, swagger.js, scoring.js
├── middlewares/        # auth.js, roles.js, premium.js, validate.js, error.js, upload.js
├── modules/
│   ├── auth/           # Register, login, refresh token rotation, logout, getMe
│   ├── students/       # Profile management, bulk grade upsert, student lookup
│   ├── schools/        # Public directory of Moroccan schools & filières (FST, ENSA, ENCG, etc.)
│   ├── assessment/     # 30-question RIASEC psychometric assessment & normalized scores
│   ├── recommendation/ # Hybrid recommendation pipeline (Structured + Vector) & LLM explanation
│   ├── gradePlanner/   # Target average planner (cutoffs, weighted average, gap analysis)
│   ├── applications/   # Application toolkit, auto-generated document checklist, file uploads
│   ├── subscriptions/  # FREE & PREMIUM plans, simulated payment gateway
│   ├── concours/       # Moroccan entrance exams, question bank, timed mock exams, study plan, AI tutor
│   ├── mentorship/     # 1-on-1 counseling sessions with state machine transitions & Jitsi links
│   ├── notifications/  # Central dispatch service (database + email)
│   ├── chatbot/        # State-machine orientation assistant
│   └── admin/          # User management, CRUD for academic data, system analytics
├── utils/              # vectorUtils.js, errors.js (AppError), response.js, pagination.js, llmClient.js
├── jobs/               # Daily deadline reminders & subscription expiry cron jobs
├── app.js              # Express app bootstrap & route assembly
└── server.js           # Server listen & graceful shutdown
```

---

## Local Setup & Getting Started

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **MySQL 8 Server**: Installed and running locally on port 3306.

### 2. Configure Local MySQL Database
Create a MySQL database for the platform:
```sql
CREATE DATABASE orientcompanion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Installation
Navigate into the backend project folder:
```bash
cd orientcompanion-backend
npm install
```

### 4. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` matches your local MySQL credentials:
```env
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/orientcompanion"
JWT_ACCESS_SECRET="orientcompanion_access_super_secret_jwt_key_2026_at_least_32_chars"
JWT_REFRESH_SECRET="orientcompanion_refresh_super_secret_jwt_key_2026_at_least_32_chars"
EMBEDDING_PROVIDER="fake"
```

### 5. Database Schema & Migration
Generate Prisma Client and apply migrations:
```bash
npx prisma generate
npx prisma db push
# or
npx prisma migrate dev --name init
```

### 6. Seed the Database
Populate the database with pre-configured Moroccan schools, filières, admissions criteria, concours questions, and test accounts:
```bash
npm run prisma:seed
# or
node prisma/seed.js
```

### 7. Start the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`:
- **API Base URL**: `http://localhost:5000/api/v1`
- **Swagger Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/health`

---

## Seed Test Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **ADMIN** | `admin@orientcompanion.ma` | `Admin123!` | System administrator with full analytics and CRUD access |
| **COUNSELOR 1** | `counselor1@orientcompanion.ma` | `Counselor123!` | Fatima-Zahra Amrani (Engineering & CPGE Specialist) |
| **COUNSELOR 2** | `counselor2@orientcompanion.ma` | `Counselor123!` | Youssef Chraibi (Business & Medicine Specialist) |
| **STUDENT 1** | `student1@orientcompanion.ma` | `Student123!` | Hamza Bennani (Pre-Bac SM_A, Free Plan) |
| **STUDENT 2** | `student2@orientcompanion.ma` | `Student123!` | Sara El Fassi (Concours Prep PC, **PREMIUM Plan Active**) |
| **STUDENT 3** | `student3@orientcompanion.ma` | `Student123!` | Omar Tazi (Pre-Bac ECO, Free Plan) |

---

## Running Unit Tests
All core calculations (scoring formulas, grade target gaps, mock exam scoring, and mentorship state machine transitions) are thoroughly tested using Jest:
```bash
npm test
```

---

## API Documentation
Interactive Swagger UI is available at:
👉 **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

You can also use the included **`requests.http`** file directly in VS Code (using REST Client) or JetBrains IDEs to test every single endpoint.

---
---

# Guide en Français

## Technologies utilisées
- **Environnement** : Node.js 20 LTS, Express 4 en modules ES natifs (`"type": "module"`).
- **Base de données & ORM** : MySQL 8 avec Prisma ORM (sans conteneur Docker).
- **Authentification & Sécurité** : JSON Web Token (Access Token 15 min + Refresh Token avec rotation 7 jours), hachage `bcrypt`, `helmet`, `cors`, `express-rate-limit` sur l'authentification.
- **Validation des données** : Middleware `validate` réutilisable basé sur `zod`.
- **Calculs & Recommandations** :
  - **100% en JavaScript** : scores pondérés du Bac, adéquation Holland RIASEC, similarité vectorielle cosinus, calcul des notes cibles et correction des examens.
  - **LLM Google Gemini** : exclusivement réservé à la rédaction d'explications et conseils pédagogiques en français à partir de chiffres déjà calculés.
- **Documentation interactive** : Swagger UI disponible sur `/api/docs`.
- **Tâches planifiées (Cron)** : Rappels automatiques d'échéances à J-30, J-7, J-1 et expiration quotidienne des abonnements.

---

## Installation locale étape par étape

### 1. Prérequis
- Node.js version 20 ou supérieure.
- Serveur MySQL 8 en cours d'exécution en local sur le port 3306.

### 2. Création de la base de données
```sql
CREATE DATABASE orientcompanion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Installation des dépendances
```bash
cd orientcompanion-backend
npm install
```

### 4. Configuration de l'environnement
Copiez le fichier `.env.example` vers `.env` et adaptez vos identifiants MySQL :
```bash
cp .env.example .env
```

### 5. Génération Prisma et migration
```bash
npx prisma generate
npx prisma db push
```

### 6. Remplissage des données initiales (Seed)
Le script de seed initialise :
- 1 administrateur, 2 conseillers d'orientation et 3 élèves types.
- 7 grandes institutions marocaines : FST Settat, ENSA Marrakech, ENCG Casablanca, ENSIAS Rabat, FMP Rabat, IAV Hassan II, CPGE Moulay Youssef.
- 20 filières académiques complètes avec seuils historiques, coefficients des matières et pièces requises.
- 2 concours nationaux (ENSA et Médecine FMP) avec 40 questions d'annales et 1 concours blanc complet.
- Les plans gratuit et Premium.
```bash
npm run prisma:seed
```

### 7. Démarrage de l'application
```bash
npm run dev
```
Accès Swagger : **`http://localhost:5000/api/docs`**

---

## Tests Unitaires
Les calculs névralgiques du système sont couverts par des tests unitaires Jest :
```bash
npm test
```
Les suites testent :
1. **Pipeline de recommandation** : formule de calcul du score structuré, similarité cosinus, et l'exemple de validation (structuré 85.0, vectoriel 86.0 → final 85.4).
2. **Planificateur de notes cibles** : calcul de la moyenne cible, distribution proportionnelle de l'écart, plafond à 20 et faisabilité (ON_TRACK, AT_RISK, UNLIKELY).
3. **Compagnon de concours** : barème des concours blancs (+1, 0, points négatifs) et planification intelligente des révisions.
4. **Mentorat** : respect strict du cycle de vie des séances (REQUESTED → SCHEDULED → COMPLETED) et rejet 409 CONFLICT des transitions non autorisées.
