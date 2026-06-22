'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RightSidebar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <aside className="hidden lg:block shrink-0 w-80 xl:w-96 pl-8 py-4 sticky top-0 h-screen overflow-y-auto px-8">
      {/* Search */}
      <div className="search-bar mb-6">
        <Search size={16} className="app-text-muted shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim()) {
              router.push(`/explore?q=${encodeURIComponent(q.trim())}`);
            }
          }}
          placeholder={t('right_sidebar.search_placeholder')}
          className="bg-transparent border-none outline-none w-full text-sm"
        />
      </div>

      {/* Who to follow */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-4">{t('right_sidebar.who_to_follow.title')}</h2>
        <p className="text-sm app-text-muted">{t('right_sidebar.who_to_follow.empty_message')}</p>
      </div>

      {/* Trending */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">{t('right_sidebar.trending.title')}</h2>
        <ul className="text-brand text-sm space-y-2">
          <li>#UrbanArt</li>
          <li>#ColorWave</li>
          <li>#DesignInspo</li>
        </ul>
      </div>
    </aside>
  );
}