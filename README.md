# 🌬️💨 Breezy : Projet API Groupe 3

> Application web de type réseau social, construite sur une architecture **microservices** en **TypeScript**, orchestrée avec **Docker Compose**.

---

## Table des matières

- [Présentation](#présentation)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation et lancement](#installation-et-lancement)
- [Variables d'environnement](#variables-denvironnement)
- [Services et ports](#services-et-ports)
- [Scripts disponibles](#scripts-disponibles)
- [Contribuer](#contribuer)

---

## Présentation

**Breezy** est une plateforme sociale permettant aux utilisateurs de créer des comptes, publier des posts, gérer leur profil et uploader des médias. Le projet suit une architecture microservices où chaque domaine fonctionnel est isolé dans son propre service avec sa propre base de données.

---

## Architecture

![Diagram showing microservices architecture with backend services connected through an API Gateway to databases and external services](documentations/schemas/Architecture%20Breezy Groupe%203.png)
Tous les services communiquent exclusivement via l'**API Gateway**, qui gère l'authentification JWT et le routage.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Langage | TypeScript (97.9%) |
| Runtime | Node.js |
| Gateway | API Gateway custom |
| Auth | JWT (Access 15min + Refresh 7j) |
| BDD relationnelle | PostgreSQL 15 |
| BDD document | MongoDB 6 |
| Cache | Redis 7 |
| Stockage médias | MinIO |
| Containerisation | Docker & Docker Compose |
| Déploiement | Render |
| Monorepo | npm Workspaces |

---

## Structure du projet

```
projet-api-groupe3/
├── backend/
│   └── services/
│       ├── api-gateway/       # Routage, auth JWT, CORS
│       ├── auth-service/      # Inscription, connexion, tokens
│       ├── user-service/      # Gestion des utilisateurs
│       ├── post-service/      # Publications
│       ├── profile-service/   # Profils utilisateurs
│       └── media-service/     # Upload et gestion de fichiers
├── frontend/                  # Application cliente
├── documentations/            # Docs API et architecture
├── docker-compose.yml
├── package.json               # Workspaces npm
├── render.yaml                # Config déploiement Render
└── .github/                   # CI/CD GitHub Actions
```

---

## Prérequis

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) ≥ 18
- npm ≥ 9

---

## Installation et lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/T0wti/projet-api-groupe3.git
cd projet-api-groupe3
```

### 2. Configurer les variables d'environnement

Créer les fichiers `.env` à la racine et dans chaque service (voir la [section dédiée](#variables-denvironnement) ci-dessous).

### 3. Lancer tous les services backend

```bash
docker compose up --build
```

### 4. (Optionnel) Alimenter les bases de données avec des données de test

```bash
npm run seed:all
```

### 5. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```


L'application sera disponible sur :
- **Frontend** → http://localhost:3000
- **API Gateway** → http://localhost:8080
- **MinIO Console** → http://localhost:9001

---

## Variables d'environnement

Chaque service possède son propre fichier `.env` à créer dans son dossier. Les valeurs ci-dessous sont les valeurs par défaut pour un environnement de développement local.

### `.env` racine (Docker Compose)

```env
# User Service (PostgreSQL)
USER_DB_USER=postgres
USER_DB_PASSWORD=password
USER_DB_NAME=breezy_user_db

# Auth Service (PostgreSQL)
AUTH_DB_USER=postgres
AUTH_DB_PASSWORD=password
AUTH_DB_NAME=breezy_auth_db

# Post Service (MongoDB)
POST_DB_USER=root
POST_DB_PASSWORD=password

# Profile Service (MongoDB)
PROFILE_DB_USER=root
PROFILE_DB_PASSWORD=password

# JWT
JWT_SECRET=change_this_secret_in_production
JWT_REFRESH_SECRET=change_this_refresh_secret_in_production

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
```

### `backend/services/api-gateway/.env`

```env
PORT=8080
JWT_SECRET=change_this_secret_in_production
CORS_ORIGIN=http://localhost:3000/
AUTH_SERVICE_URL=http://auth-service:5000/
USER_SERVICE_URL=http://user-service:3001/
POST_SERVICE_URL=http://post-service:3003/
PROFILE_SERVICE_URL=http://profile-service:3004/
```

### `backend/services/auth-service/.env`

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5433/breezy_auth_db
JWT_SECRET=change_this_secret_in_production
JWT_REFRESH_SECRET=change_this_refresh_secret_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
USER_SERVICE_URL=http://user-service:3001/
```

### `backend/services/post-service/.env`

```env
PORT=3003
MONGO_URI=mongodb://localhost:27017/post-service
```

### `backend/services/profile-service/.env`

```env
PORT=3004
MONGO_URI=mongodb://profile-db:27017/profile-service
```

### `backend/services/user-service/.env`

```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/breezy_user_db
```

---

## Services et ports

| Service | Port local | Base de données | Port BDD |
|---|---|---|---|
| API Gateway | `8080` | — | — |
| Auth Service | `5001` | PostgreSQL | `5433` |
| User Service | `3001` | PostgreSQL | `5432` |
| Post Service | `3003` | MongoDB | `27017` |
| Profile Service | `3004` | MongoDB | `27018` |
| Media Service | `3005` | MinIO | `9000` |
| MinIO Console | `9001` | — | — |
| Redis | — | — | — |
| Frontend | `3000` | — | — |

---

## Scripts disponibles

```bash
# Lancer tous les services Docker
docker compose up

# Lancer en arrière-plan
docker compose up -d

# Arrêter tous les services
docker compose down

# Seed toutes les bases de données
npm run seed:all

# Rebuild un service spécifique
docker compose up --build <nom-du-service>
```

---

## Contribuer

1. Forker le projet
2. Créer une branche feature : `git checkout -b feature/ma-fonctionnalite`
3. Committer les changements : `git commit -m 'feat: ajout de ma fonctionnalité'`
4. Pousser la branche : `git push origin feature/ma-fonctionnalite`
5. Ouvrir une **Pull Request**

> Consulter les [Issues ouvertes](https://github.com/T0wti/projet-api-groupe3/issues) pour voir les tâches en cours.

---

*Projet réalisé par le **Groupe 3** — Formation API & Microservices*