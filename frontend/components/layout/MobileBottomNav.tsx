'use client';

import Link from 'next/link';
import { Home, Search, Plus, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const { logout, user } = useAuth();
  const profileHref = user ? `/profile/${encodeURIComponent(user.username)}` : '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 z-50 md:hidden">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <Link href="/" className="text-gray-500 hover:text-brand transition-colors p-2">
          <Home size={24} />
        </Link>
        <Link href="/explore" className="text-gray-500 hover:text-brand transition-colors p-2">
          <Search size={24} />
        </Link>

        <Link href="/compose" className="bg-brand text-white rounded-full p-2 hover:bg-brand-hover transition-colors">
          <Plus size={24} />
        </Link>

        <Link href="/notifications" className="text-gray-500 hover:text-brand transition-colors p-2">
          <Bell size={24} />
        </Link>

        <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors p-2">
          <LogOut size={24} />
        </button>
      </div>
    </nav>
  );
}
