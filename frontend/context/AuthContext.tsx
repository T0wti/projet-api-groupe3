'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchAvatarUrl(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/profile/${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.avatar_url ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, []);

  function updateUser(partial: Partial<AuthUser>) {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  async function restoreSession() {
    try {
      const res = await fetch('/api/auth/verify');
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const { payload } = await res.json();

      const userRes = await fetch(`/api/users/${payload.user_id}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        const avatarUrl = await fetchAvatarUrl(payload.user_id);
        setUser({ ...userData, avatarUrl: avatarUrl ?? userData.avatarUrl });
      } else {
        setUser({ id: payload.user_id, email: payload.email, username: payload.email.split('@')[0], role: payload.role });
      }
    } catch {
      // Network error — leave user as null
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = res.headers.get('content-type')?.includes('application/json')
      ? await res.json()
      : {};
    if (!res.ok) throw new Error(data.message || 'Login failed');

    const userRes = await fetch(`/api/users/${data.userId}`);
    if (userRes.ok) {
      const userData = await userRes.json();
      const avatarUrl = await fetchAvatarUrl(data.userId);
      setUser({ ...userData, avatarUrl: avatarUrl ?? userData.avatarUrl });
    }

    router.push('/');
  }

  async function register(username: string, email: string, password: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = res.headers.get('content-type')?.includes('application/json')
      ? await res.json()
      : {};
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    const userRes = await fetch(`/api/users/${data.userId}`);
    if (userRes.ok) setUser(await userRes.json());

    router.push('/');
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    router.push('/auth');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
