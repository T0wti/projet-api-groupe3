'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, FormEvent } from 'react';
import type { CSSProperties } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type AuthTheme = 'light' | 'dark';

const AUTH_THEME_VARS: Record<AuthTheme, CSSProperties> = {
  light: {
    '--app-bg': '#f8fafc',
    '--app-surface': '#ffffff',
    '--app-surface-elevated': '#ffffff',
    '--app-muted-surface': '#f3f4f6',
    '--app-border': '#e5e7eb',
    '--app-text': '#111827',
    '--app-text-muted': '#6b7280',
  } as CSSProperties,
  dark: {
    '--app-bg': '#0f172a',
    '--app-surface': '#111827',
    '--app-surface-elevated': '#172033',
    '--app-muted-surface': '#1f2937',
    '--app-border': '#334155',
    '--app-text': '#f8fafc',
    '--app-text-muted': '#94a3b8',
  } as CSSProperties,
};

export default function AuthPage() {
  const { t } = useTranslation('auth');
  const { login, register } = useAuth();
  const { theme } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authTheme, setAuthTheme] = useState<AuthTheme>(theme);

  const nextTheme = authTheme === 'dark' ? 'light' : 'dark';

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error_unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 transition-colors"
      style={{
        ...AUTH_THEME_VARS[authTheme],
        backgroundColor: 'var(--app-bg)',
        color: 'var(--app-text)',
      }}
    >
      <div className="w-full max-w-md">
        <div className="border app-border rounded-3xl shadow-sm p-8 app-surface-elevated">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Breezy
              </p>
              <p className="mt-1 text-sm app-text-muted">{t('login.theme_label')}</p>
            </div>

            <button
              type="button"
              onClick={() => setAuthTheme(nextTheme)}
              className="inline-flex items-center gap-2 rounded-full border app-border app-surface-muted px-3 py-2 text-sm font-medium app-text transition app-hover-surface"
              aria-label={t(`login.theme_${nextTheme}`)}
            >
              {authTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{t(`login.theme_${authTheme}`)}</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold app-text">
              {isLogin ? t('login.login_title') : t('login.register_title')}
            </h1>
            <p className="text-sm app-text-muted mt-1">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <div>
                <label className="text-sm app-text-muted">{t('login.username_label')}</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border app-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                />
              </div>
            )}

            <div>
              <label className="text-sm app-text-muted">{t('login.email_label')}</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border app-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="text-sm app-text-muted">{t('login.password_label')}</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border app-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg font-medium text-white transition bg-[#0E7490] hover:bg-[#0c6278] disabled:opacity-50"
            >
              {loading
                ? t('login.loading')
                : isLogin
                  ? t('login.login_btn')
                  : t('login.register_btn')}
            </button>
          </form>

          {error && (
            <p className="text-center text-sm mt-4 text-red-500">
              {error}
            </p>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-medium text-[#0E7490] hover:text-[#3B82F6]"
            >
              {isLogin
                ? t('login.switch_to_register')
                : t('login.switch_to_login')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

