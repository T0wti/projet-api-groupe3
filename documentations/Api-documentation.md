# 🌬️💨 Breezy — Documentation des APIs

> Architecture microservices — toutes les requêtes transitent par l'**API Gateway** (`http://localhost:8080`).

---

## 📋 Table des matières

1. [Architecture & Authentification](#1-architecture--authentification)
2. [Auth Service — `/api/auth`](#2-auth-service----apiauth)
3. [User Service — `/api/users`](#3-user-service----apiusers)
4. [Post Service — `/api/posts`](#4-post-service----apiposts)
5. [Comment Service — `/api/comments`](#5-comment-service----apicomments)
6. [Post Likes — `/api/post-likes`](#6-post-likes----apipost-likes)
7. [Comment Likes — `/api/comment-likes`](#7-comment-likes----apicomment-likes)
8. [Reports — `/api/reports`](#8-reports----apireports)
9. [Profile Service — `/api/profile`](#9-profile-service----apiprofile)
10. [Media Service — `/api/media`](#10-media-service----apimedia)
11. [Codes d'erreur communs](#11-codes-derreur-communs)

---

## 1. Architecture & Authentification

### Fonctionnement général

Tous les appels passent par le **API Gateway** (`http://localhost:8080`). Celui-ci :

- Vérifie et valide les tokens JWT
- Injecte les headers `x-user-id` et `x-user-role` vers les micro-services
- Gère les règles d'accès (public / authentifié / rôle requis)

### Authentification JWT

Le système utilise **deux tokens** stockés en cookies HTTP-only :

| Cookie | Durée de vie | Rôle |
|---|---|---|
| `breezy_access` | 15 minutes | Token d'accès pour les requêtes API |
| `breezy_refresh` | 7 jours | Renouvellement du token d'accès |

**Pour les clients non-browser**, les tokens peuvent aussi être passés en body JSON.

### Niveaux d'accès

| Rôle | Description |
|---|---|
| `user` | Utilisateur standard (défaut) |
| `moderator` | Peut modérer les utilisateurs `user` et gérer les signalements |
| `admin` | Accès complet, gestion des rôles |

---

## 2. Auth Service — `/api/auth`

> **Base URL :** `http://localhost:8080/api/auth`

### POST `/api/auth/register`

Inscrit un nouvel utilisateur. Crée simultanément le compte auth, l'utilisateur et le profil.

**Authentification :** Publique

**Body (JSON) :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `username` | string | &check; | 3–30 caractères, lettres/chiffres/`_`/`.` |
| `email` | string | &check; | Adresse email valide |
| `password` | string | &check; | Doit respecter les critères de sécurité |

**Réponse 201 :**

```json
{ "userId": "uuid-v4" }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | Champs manquants, username invalide, email invalide, mot de passe trop faible |
| 409 | Email déjà utilisé |
| 502 | Échec de la création du profil dans un service dépendant |

---

### POST `/api/auth/login`

Connecte un utilisateur existant.

**Authentification :** Publique

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `email` | string | &check; |
| `password` | string | &check; |

**Réponse 200 :**

```json
{ "userId": "uuid-v4" }
```

Les cookies `breezy_access` et `breezy_refresh` sont définis automatiquement.

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | Champs manquants |
| 401 | Identifiants incorrects |
| 403 | Compte banni ou suspendu |
| 502 | Impossible de vérifier le statut du compte |

---

### POST `/api/auth/refresh`

Renouvelle le token d'accès à partir du refresh token.

**Authentification :** Publique

**Sources du refresh token (par priorité) :**
1. Cookie `breezy_refresh`
2. Body JSON : `{ "refreshToken": "..." }`

**Réponse 200 :**

```json
{ "ok": true }
```

Le nouveau cookie `breezy_access` est défini automatiquement.

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | Refresh token absent |
| 401 | Token invalide ou expiré |
| 403 | Compte banni ou suspendu |

---

### POST `/api/auth/logout`

Déconnecte l'utilisateur et invalide le refresh token.

**Authentification :** Publique

**Sources du refresh token (par priorité) :**
1. Cookie `breezy_refresh`
2. Body JSON : `{ "refreshToken": "..." }`

**Réponse 200 :**

```json
{ "message": "Logged out successfully" }
```

---

### GET `/api/auth/verify`

Vérifie la validité d'un token d'accès Bearer.

**Authentification :** Publique

**Header requis :**

```
Authorization: Bearer <access_token>
```

**Réponse 200 :**

```json
{
  "valid": true,
  "payload": { "user_id": "...", "email": "...", "role": "..." }
}
```

**Erreurs :**

| Code | Cause |
|---|---|
| 401 | Token absent, invalide ou expiré |

---

### PATCH `/api/auth/password`

Modifie le mot de passe de l'utilisateur connecté. Invalide toutes les sessions actives.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `currentPassword` | string | &check; |
| `newPassword` | string | &check; |

**Réponse 200 :**

```json
{ "message": "Password updated successfully. Please log in again." }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | Champs manquants, nouveau mot de passe trop faible |
| 401 | Mot de passe actuel incorrect |
| 404 | Utilisateur introuvable |

---

### PATCH `/api/auth/email`

Modifie l'adresse email de l'utilisateur connecté.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `newEmail` | string | &check; |
| `currentPassword` | string | &check; |

**Réponse 200 :**

```json
{ "message": "Email updated successfully." }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | Champs manquants, format email invalide |
| 401 | Mot de passe incorrect |
| 404 | Utilisateur introuvable |
| 409 | Email déjà utilisé |
| 502 | Échec de la mise à jour dans user-service |

---

## 3. User Service — `/api/users`

> **Base URL :** `http://localhost:8080/api/users`

### POST `/api/users`

Crée l'entrée utilisateur dans la base. **Appelé en interne par auth-service lors de l'inscription.**

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `username` | string | &check; |
| `email` | string | &check; |

**Réponse 201 :** L'objet utilisateur complet.

---

### GET `/api/users/search`

Recherche des utilisateurs par username (insensible à la casse).

**Authentification :** Requise

**Query params :**

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `q` | string | &check; | Terme de recherche (contenu dans le username) |
| `includeInactive` | boolean | &cross; | Inclure les comptes suspendus/bannis (défaut : `false`) |

**Réponse 200 :**

```json
[
  { "id": "...", "username": "...", "email": "...", "role": "user", "status": "active" }
]
```

Limité à 20 résultats.

---

### GET `/api/users/:id/public`

Récupère le résumé public d'un utilisateur (id, username, avatarUrl).

**Authentification :** Requise

**Réponse 200 :**

```json
{ "id": "...", "username": "...", "avatarUrl": "..." }
```

---

### GET `/api/users/username/:username/public`

Récupère le résumé public d'un utilisateur par son username.

**Authentification :** Requise

**Réponse 200 :**

```json
{ "id": "...", "username": "...", "avatarUrl": "..." }
```

---

### GET `/api/users/:id`

Récupère les informations complètes d'un utilisateur.

**Authentification :** Requise

**Réponse 200 :** L'objet utilisateur complet (inclut rôle, statut, préférences).

---

### PUT `/api/users/:id`

Met à jour les informations d'un utilisateur.

**Authentification :** Requise — Propriétaire uniquement (ou `admin`)

**Body (JSON) — tous les champs sont optionnels :**

| Champ | Type | Description |
|---|---|---|
| `username` | string | Nouveau nom d'utilisateur |
| `email` | string | Nouvelle adresse email |
| `avatar_url` | string | URL de l'avatar |
| `language_preference` | string | Préférence de langue (ex : `fr`, `en`) |
| `theme_preference` | string | Thème d'interface (ex : `light`, `dark`) |

**Réponse 200 :** L'objet utilisateur mis à jour.

**Erreurs :**

| Code | Cause |
|---|---|
| 404 | Utilisateur introuvable |
| 409 | Username ou email déjà pris |

---

### DELETE `/api/users/:id`

Supprime un compte utilisateur.

**Authentification :** Requise — Propriétaire uniquement (ou `admin`)

**Réponse 200 :**

```json
{ "message": "Account deleted successfully." }
```

---

### PATCH `/api/users/:id/role`

Modifie le rôle d'un utilisateur.

**Authentification :** Requise — `admin` uniquement

**Body (JSON) :**

| Champ | Type | Requis | Valeurs |
|---|---|---|---|
| `role` | string | &check; | `user`, `moderator`, `admin` |

**Réponse 200 :** L'objet utilisateur mis à jour.

---

### PATCH `/api/users/:id/suspend`

Suspend temporairement un compte utilisateur.

**Authentification :** Requise — `moderator` ou `admin`

> ⚠️ Un modérateur ne peut suspendre que des utilisateurs avec le rôle `user`.

**Body (JSON) :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `until` | string (ISO 8601) | &check; | Date de fin de suspension (doit être dans le futur) |
| `reason` | string | &cross; | Raison de la suspension |

**Réponse 200 :** L'objet utilisateur mis à jour.

---

### PATCH `/api/users/:id/ban`

Bannit définitivement un compte utilisateur.

**Authentification :** Requise — `moderator` ou `admin`

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `reason` | string | &cross; |

**Réponse 200 :** L'objet utilisateur mis à jour.

---

### PATCH `/api/users/:id/reinstate`

Lève la suspension ou le bannissement d'un utilisateur.

**Authentification :** Requise — `moderator` ou `admin`

**Réponse 200 :** L'objet utilisateur réactivé.

---

## 4. Post Service — `/api/posts`

> **Base URL :** `http://localhost:8080/api/posts`

### POST `/api/posts`

Crée un nouveau post ou une réponse (reply) à un post existant.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `content` | string | &cross; | Contenu textuel du post |
| `media` | object | &cross; | `{ "type": "image"\|"video", "url": "...", "object_name": "..." }` |
| `tags` | string[] | &cross; | Liste de tags (ex : `["breezy", "web"]`) |
| `parentPost` | string (ObjectId) | &cross; | ID du post parent (pour créer un reply) |

**Réponse 201 :**

```json
{
  "_id": "...",
  "authorId": "...",
  "content": "...",
  "media": { "type": null, "url": null },
  "tags": ["breezy"],
  "parentPost": null,
  "likesCount": 0,
  "commentsCount": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### GET `/api/posts`

Récupère tous les posts principaux (exclut les replies).

**Authentification :** Requise

**Réponse 200 :** Tableau de posts avec leurs tags, triés par date décroissante.

---

### GET `/api/posts/feed`

Récupère les posts d'une liste d'auteurs (flux "personnes suivies").

**Authentification :** Requise

**Query params :**

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `authorIds` | string | &check; | IDs séparés par des virgules (ex : `id1,id2`) |

**Réponse 200 :** Tableau de posts, triés par date décroissante. Retourne `[]` si `authorIds` est vide.

---

### GET `/api/posts/batch`

Récupère un ensemble de posts par leurs IDs.

**Authentification :** Requise

**Query params :**

| Paramètre | Type | Requis | Description |
|---|---|---|---|
| `ids` | string | &check; | IDs séparés par des virgules |

**Réponse 200 :** Tableau de posts avec leurs tags.

---

### GET `/api/posts/trending-tags`

Retourne les 3 tags les plus utilisés sur la plateforme.

**Authentification :** Requise

**Réponse 200 :**

```json
[
  { "tag": "breezy", "count": 42 },
  { "tag": "web", "count": 30 },
  { "tag": "api", "count": 18 }
]
```

---

### GET `/api/posts/tags/:tag`

Récupère tous les posts associés à un tag donné.

**Authentification :** Requise

**Réponse 200 :** Tableau de posts principaux avec leurs tags.

---

### GET `/api/posts/search`

Recherche des posts par contenu textuel ou tag.

**Authentification :** Requise

**Query params :**

| Paramètre | Type | Requis |
|---|---|---|
| `q` | string | &check; |

**Réponse 200 :** Tableau de posts, classés par pertinence (full-text + tag).

---

### GET `/api/posts/:id`

Récupère un post spécifique avec ses replies directes.

**Authentification :** Requise

**Réponse 200 :**

```json
{
  "post": { "...": "objet post avec tags" },
  "replies": [ "...liste de replies avec tags" ]
}
```

---

### GET `/api/posts/:id/replies`

Récupère uniquement les replies d'un post.

**Authentification :** Requise

**Réponse 200 :** Tableau de replies avec leurs tags, triés par date croissante.

---

### PUT `/api/posts/:id`

Met à jour un post existant.

**Authentification :** Requise — Auteur uniquement

**Body (JSON) — tous les champs sont optionnels :**

| Champ | Type | Description |
|---|---|---|
| `content` | string | Nouveau contenu |
| `media` | object | Nouveau média |
| `tags` | string[] | Remplace tous les tags existants |

**Réponse 200 :** Le post mis à jour avec ses tags.

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | ID invalide |
| 403 | L'utilisateur n'est pas l'auteur |
| 404 | Post introuvable |

---

### DELETE `/api/posts/:id`

Supprime un post et nettoie ses médias et tags associés.

**Authentification :** Requise — Auteur, `moderator` ou `admin`

**Réponse 200 :**

```json
{ "message": "Post deleted successfully." }
```

> Si le post est un reply, le `commentsCount` du post parent est décrémenté automatiquement.

---

## 5. Comment Service — `/api/comments`

> **Base URL :** `http://localhost:8080/api/comments`

### POST `/api/comments`

Crée un commentaire sur un post, ou une réponse à un commentaire existant.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `post_id` | string (ObjectId) | &check; | ID du post commenté |
| `content` | string | &cross; | Contenu du commentaire |
| `media` | object | &cross; | `{ "type": "...", "url": "...", "object_name": "..." }` |
| `tags` | string[] | &cross; | Liste de tags |
| `parent_comment_id` | string (ObjectId) | &cross; | ID du commentaire parent (pour une réponse) |

**Réponse 201 :** L'objet commentaire créé avec ses tags.

---

### GET `/api/comments/post/:postId`

Récupère tous les commentaires racines d'un post.

**Authentification :** Requise

**Réponse 200 :** Tableau de commentaires (sans les réponses imbriquées), triés par date décroissante.

---

### GET `/api/comments/user/:userId`

Récupère tous les commentaires racines d'un utilisateur.

**Authentification :** Requise

**Réponse 200 :** Tableau de commentaires avec leurs tags.

---

### GET `/api/comments/:id/replies`

Récupère les réponses d'un commentaire.

**Authentification :** Requise

**Réponse 200 :** Tableau de réponses, triées par date croissante.

---

### GET `/api/comments/tags/:tag`

Récupère les commentaires associés à un tag.

**Authentification :** Requise

**Réponse 200 :** Tableau de commentaires avec leurs tags.

---

### GET `/api/comments/search`

Recherche des commentaires par contenu ou tag.

**Authentification :** Requise

**Query params :**

| Paramètre | Type | Requis |
|---|---|---|
| `q` | string | &check; |

**Réponse 200 :** Tableau de commentaires, classés par pertinence.

---

### GET `/api/comments/:id`

Récupère un commentaire spécifique par son ID.

**Authentification :** Requise

**Réponse 200 :** L'objet commentaire avec ses tags.

---

### PUT `/api/comments/:id`

Modifie un commentaire existant.

**Authentification :** Requise — Auteur uniquement

**Body (JSON) :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `content` | string | &check; | Nouveau contenu |
| `tags` | string[] | &cross; | Remplace tous les tags existants |

**Réponse 200 :** Le commentaire mis à jour avec ses tags.

---

### DELETE `/api/comments/:id`

Supprime un commentaire et toutes ses réponses en cascade.

**Authentification :** Requise — Auteur uniquement

**Réponse 200 :**

```json
{ "message": "Comment deleted successfully." }
```

> Le `commentsCount` du post parent (et du commentaire parent si applicable) est décrémenté automatiquement.

---

## 6. Post Likes — `/api/post-likes`

> **Base URL :** `http://localhost:8080/api/post-likes`

### POST `/api/post-likes`

Ajoute un like sur un post.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `post_id` | string (ObjectId) | &check; |

**Réponse 200 :**

```json
{ "message": "Post liked successfully." }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | `post_id` manquant ou invalide |
| 409 | Post déjà liké par cet utilisateur |

---

### DELETE `/api/post-likes`

Retire un like d'un post.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `post_id` | string (ObjectId) | &check; |

**Réponse 200 :**

```json
{ "message": "Post unliked successfully." }
```

---

### GET `/api/post-likes/user/:userId`

Récupère la liste des posts likés par un utilisateur.

**Authentification :** Requise

**Réponse 200 :**

```json
{ "user_id": "...", "liked_posts": ["post_id_1", "post_id_2"] }
```

---

### GET `/api/post-likes/post/:postId`

Récupère la liste des utilisateurs ayant liké un post.

**Authentification :** Requise

**Réponse 200 :**

```json
{ "post_id": "...", "likers": ["user_id_1", "user_id_2"] }
```

---

## 7. Comment Likes — `/api/comment-likes`

> **Base URL :** `http://localhost:8080/api/comment-likes`

### POST `/api/comment-likes`

Ajoute un like sur un commentaire.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `comment_id` | string (ObjectId) | &check; |

**Réponse 200 :**

```json
{ "message": "Comment liked successfully." }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | `comment_id` manquant ou invalide |
| 404 | Commentaire introuvable |
| 409 | Commentaire déjà liké |

---

### DELETE `/api/comment-likes`

Retire un like d'un commentaire.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `comment_id` | string (ObjectId) | &check; |

**Réponse 200 :**

```json
{ "message": "Comment unliked successfully." }
```

---

### GET `/api/comment-likes/user/:userId`

Récupère la liste des commentaires likés par un utilisateur.

**Authentification :** Requise

**Réponse 200 :**

```json
{ "user_id": "...", "liked_comments": ["comment_id_1", "comment_id_2"] }
```

---

### GET `/api/comment-likes/comment/:commentId`

Récupère la liste des utilisateurs ayant liké un commentaire.

**Authentification :** Requise

**Réponse 200 :**

```json
{ "comment_id": "...", "likers": ["user_id_1", "user_id_2"] }
```

---

## 8. Reports — `/api/reports`

> **Base URL :** `http://localhost:8080/api/reports`

### POST `/api/reports`

Signale un post ou un commentaire.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis | Valeurs |
|---|---|---|---|
| `target_type` | string | &check; | `"post"` ou `"comment"` |
| `target_id` | string (ObjectId) | &check; | ID du contenu signalé |
| `reason` | string | &check; | Voir les raisons valides ci-dessous |

**Raisons valides (`reason`) :** définis dans le modèle `REPORT_REASONS`.

**Réponse 201 :** L'objet signalement créé.

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | Champs manquants, `target_type` invalide, `reason` invalide, `target_id` invalide |
| 404 | Post ou commentaire ciblé introuvable |

---

### GET `/api/reports`

Récupère la liste des signalements.

**Authentification :** Requise — `moderator` ou `admin`

**Query params :**

| Paramètre | Type | Défaut | Valeurs |
|---|---|---|---|
| `status` | string | `pending` | `pending`, `reviewed`, `dismissed`, `action_taken` |

**Réponse 200 :** Tableau de signalements, triés par date décroissante.

---

### PATCH `/api/reports/:id`

Met à jour le statut d'un signalement (traitement par un modérateur).

**Authentification :** Requise — `moderator` ou `admin`

**Body (JSON) :**

| Champ | Type | Requis | Valeurs |
|---|---|---|---|
| `status` | string | &check; | `"reviewed"`, `"dismissed"`, `"action_taken"` |

**Réponse 200 :** Le signalement mis à jour (inclut `reviewed_by` et `reviewed_at`).

---

### GET `/api/reports/post/:postId`

Récupère tous les signalements ciblant un post spécifique.

**Authentification :** Requise — `moderator` ou `admin`

**Réponse 200 :** Tableau de signalements.

---

### GET `/api/reports/comment/:commentId`

Récupère tous les signalements ciblant un commentaire spécifique.

**Authentification :** Requise — `moderator` ou `admin`

**Réponse 200 :** Tableau de signalements.

---

## 9. Profile Service — `/api/profile`

> **Base URL :** `http://localhost:8080/api/profile`

### POST `/api/profile`

Crée le profil d'un utilisateur. **Appelé automatiquement lors de l'inscription.**

**Authentification :** Requise

**Body (JSON) — optionnel :**

| Champ | Type | Description |
|---|---|---|
| `bio` | string | Biographie de l'utilisateur |
| `avatar_url` | string | URL de l'avatar |

**Réponse 201 :** L'objet profil créé.

**Erreurs :**

| Code | Cause |
|---|---|
| 409 | Un profil existe déjà pour cet utilisateur |

---

### GET `/api/profile/:userId`

Récupère le profil d'un utilisateur ainsi que ses compteurs (followers/following).

**Authentification :** Requise

**Réponse 200 :**

```json
{
  "user_id": "...",
  "bio": "...",
  "avatar_url": "...",
  "counters": {
    "followers_count": 10,
    "following_count": 5
  }
}
```

---

### PUT `/api/profile/:userId`

Met à jour partiellement un profil utilisateur.

**Authentification :** Requise — Propriétaire uniquement (ou `admin`)

**Body (JSON) — tous les champs sont optionnels :**

| Champ | Type | Description |
|---|---|---|
| `bio` | string | Nouvelle biographie |
| `avatar_url` | string | Nouvelle URL d'avatar |

**Réponse 200 :** Le profil mis à jour.

---

### DELETE `/api/profile/:userId`

Supprime un profil et ses compteurs associés.

**Authentification :** Requise — Propriétaire uniquement (ou `admin`)

**Réponse 200 :**

```json
{ "message": "Profile deleted" }
```

---

### POST `/api/profile/follow`

Abonne l'utilisateur connecté à un autre utilisateur.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `following_id` | string | &check; |

**Réponse 200 :**

```json
{ "message": "User followed successfully" }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | `following_id` manquant, tentative de se suivre soi-même |
| 409 | Déjà abonné à cet utilisateur |

---

### POST `/api/profile/unfollow`

Désabonne l'utilisateur connecté d'un autre utilisateur.

**Authentification :** Requise

**Body (JSON) :**

| Champ | Type | Requis |
|---|---|---|
| `following_id` | string | &check; |

**Réponse 200 :**

```json
{ "message": "User unfollowed successfully" }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 404 | Relation de suivi introuvable |

---

### GET `/api/profile/:userId/followers`

Récupère la liste des abonnés d'un utilisateur.

**Authentification :** Requise

**Réponse 200 :**

```json
{ "user_id": "...", "followers": ["user_id_1", "user_id_2"] }
```

---

### GET `/api/profile/:userId/following`

Récupère la liste des utilisateurs suivis par un utilisateur.

**Authentification :** Requise

**Réponse 200 :**

```json
{ "user_id": "...", "following": ["user_id_1", "user_id_2"] }
```

---

### GET `/api/profile/suggestions`

Retourne jusqu'à 3 suggestions d'utilisateurs à suivre (classés par nombre de followers, en excluant les personnes déjà suivies et soi-même).

**Authentification :** Requise

**Query params :**

| Paramètre | Type | Requis |
|---|---|---|
| `userId` | string | &check; |

**Réponse 200 :**

```json
[
  { "user_id": "...", "followers_count": 150 },
  { "user_id": "...", "followers_count": 80 }
]
```

---

## 10. Media Service — `/api/media`

> **Base URL :** `http://localhost:8080/api/media`

### POST `/api/media`

Upload d'un fichier image ou vidéo (stocké dans MinIO / Cloudflare R2).

**Authentification :** Requise

**Format de la requête :** `multipart/form-data`

| Champ | Type | Requis | Description |
|---|---|---|---|
| `file` | fichier | &check; | Image ou vidéo à uploader |

**Réponse 201 :**

```json
{
  "type": "image",
  "url": "http://localhost:9000/breezy-media/user-id/uuid.jpg",
  "object_name": "user-id/uuid.jpg"
}
```

> Conserver `object_name` pour pouvoir supprimer le fichier ultérieurement.

**Erreurs :**

| Code | Cause |
|---|---|
| 400 | Aucun fichier fourni |

---

### DELETE `/api/media/*objectName`

Supprime un fichier média du stockage.

**Authentification :** Requise — Propriétaire du fichier (ou `moderator` / `admin`)

**Paramètre d'URL :** `objectName` — le chemin complet retourné lors de l'upload (ex : `user-id/uuid.jpg`).

**Réponse 200 :**

```json
{ "message": "Media deleted successfully." }
```

**Erreurs :**

| Code | Cause |
|---|---|
| 403 | L'utilisateur n'est pas propriétaire du fichier |

---

## 11. Codes d'erreur communs

| Code HTTP | Signification |
|---|---|
| 400 | Bad Request — paramètres manquants ou invalides |
| 401 | Unauthorized — token absent, invalide ou expiré |
| 403 | Forbidden — permissions insuffisantes |
| 404 | Not Found — ressource introuvable |
| 409 | Conflict — ressource déjà existante (doublon) |
| 502 | Bad Gateway — échec de communication inter-services |

**Format d'erreur standard :**

```json
{ "error": "Message d'erreur descriptif" }
```

---

*Documentation générée à partir du code source — Breezy, Groupe 3*