'use client';

import Link from 'next/link';
import { Home, Search, Shield, LogOut, Settings, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PublishPostModal from '../feed/PublishPostModal';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'moderator';
  const profileHref = user ? `/profile/${encodeURIComponent(user.username)}` : '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 app-surface border-t app-border py-3 px-4 z-50 md:hidden">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <Link href="/" className="app-text-muted hover:text-brand transition-colors p-2" aria-label={t('sidebar.nav.home')}>
          <Home size={24} />
        </Link>
        <Link href={profileHref} className="app-text-muted hover:text-brand transition-colors p-2" aria-label={t('sidebar.nav.profile')}>
          <User size={24} />
        </Link>
        <Link href="/explore" className="app-text-muted hover:text-brand transition-colors p-2" aria-label={t('sidebar.nav.explore')}>
          <Search size={24} />
        </Link>

        <PublishPostModal triggerVariant="mobile" />

        {isStaff && (
          <Link href="/staff" className="app-text-muted hover:text-brand transition-colors p-2" aria-label={t('sidebar.nav.staff')}>
            <Shield size={24} />
          </Link>
        )}

        <Link href="/preferences" className="app-text-muted hover:text-brand transition-colors p-2" aria-label={t('sidebar.nav.preferences')}>
          <Settings size={24} />
        </Link>

        <button onClick={logout} className="app-text-muted hover:text-red-500 transition-colors p-2" aria-label={t('sidebar.logout_button')}>
          <LogOut size={24} />
        </button>
      </div>
    </nav>
  );
}
