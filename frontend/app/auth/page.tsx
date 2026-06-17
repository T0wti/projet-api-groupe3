'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const { t } = useTranslation('auth');
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="border border-gray-200 rounded-2xl shadow-sm p-8 bg-white">

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isLogin ? t('login.login_title') : t('login.register_title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <div>
                <label className="text-sm text-gray-600">{t('login.username_label')}</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600">{t('login.email_label')}</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">{t('login.password_label')}</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
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

