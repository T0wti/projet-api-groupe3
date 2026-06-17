'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      // Gateway reads breezy_access cookie, verifies it, returns payload
      const res = await fetch('/api/auth/verify');
      if (!res.ok) {
        setIsLoading(false);
        return;
      }
      const { payload } = await res.json();

      // Fetch full profile (username etc.) from user-service via gateway
      const profileRes = await fetch(`/api/users/${payload.user_id}`);
      if (profileRes.ok) {
        setUser(await profileRes.json());
      } else {
        // Profile missing in user-service — use JWT payload as fallback
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

    // Cookies are set by auth-service in the response — fetch the profile
    const profileRes = await fetch(`/api/users/${data.userId}`);
    if (profileRes.ok) setUser(await profileRes.json());

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

    const profileRes = await fetch(`/api/users/${data.userId}`);
    if (profileRes.ok) setUser(await profileRes.json());

    router.push('/');
  }

  async function logout() {
    // Cookie (breezy_refresh) sent automatically — auth-service clears both cookies
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    router.push('/auth');
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
