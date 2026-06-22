export type UserRole = 'user' | 'moderator' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
}

// Raw shape returned by GET /api/users/:id (user-service / Prisma)
export interface BackendUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  suspendedUntil?: string | null;
  statusReason?: string | null;
  avatarUrl?: string | null;
  languagePreference: string;
  themePreference: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPublicUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
}
