export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
}

// Raw shape returned by GET /api/users/:id (user-service / Prisma)
export interface BackendUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  languagePreference: string;
  themePreference: string;
  createdAt: string;
  updatedAt: string;
}
