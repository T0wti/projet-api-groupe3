'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { fetchTrendingTags } from '@/lib/api/posts';
import { fetchSuggestedAccounts, followUser } from '@/lib/api/profile';
import { fetchPublicUserById } from '@/lib/api/users';
import Avatar from '@/components/ui/Avatar';

interface SuggestedUser {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  followersCount: number;
}

export default function RightSidebar() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTrendingTags().then(setTrendingTags).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchSuggestedAccounts(user.id)
      .then(async (raw) => {
        const enriched = await Promise.allSettled(
          raw.map(async (s) => {
            const pub = await fetchPublicUserById(s.user_id);
            return {
              userId: s.user_id,
              username: pub.username,
              avatarUrl: pub.avatarUrl ?? null,
              followersCount: s.followers_count,
            };
          })
        );
        setSuggestions(
          enriched
            .filter((r): r is PromiseFulfilledResult<SuggestedUser> => r.status === 'fulfilled')
            .map((r) => r.value)
        );
      })
      .catch(() => {});
  }, [user]);

  async function handleFollow(targetId: string) {
    if (!user) return;
    try {
      await followUser(user.id, targetId);
      setFollowingIds((prev) => new Set([...prev, targetId]));
      setSuggestions((prev) => prev.filter((s) => s.userId !== targetId));
    } catch {
      // already following or error — silently ignore
    }
  }

  return (
    <aside className="hidden lg:block shrink-0 w-80 xl:w-96 pl-8 py-4 sticky top-0 h-screen overflow-y-auto px-8">
      {/* Search */}
      <div className="search-bar mb-6">
        <Search size={16} className="text-gray-400 shrink-0" />
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
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">{t('right_sidebar.who_to_follow.empty_message')}</p>
        ) : (
          <ul className="space-y-3">
            {suggestions.map((s) => (
              <li key={s.userId} className="flex items-center gap-3">
                <Link href={`/profile/${s.username}`} className="shrink-0">
                  <Avatar src={s.avatarUrl} alt={s.username} size="sm" />
                </Link>
                <Link href={`/profile/${s.username}`} className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.username}</p>
                  <p className="text-xs text-gray-500">{s.followersCount} followers</p>
                </Link>
                <button
                  onClick={() => handleFollow(s.userId)}
                  className="shrink-0 text-xs font-semibold text-white bg-brand px-3 py-1 rounded-full hover:opacity-90 transition-opacity"
                >
                  {t('right_sidebar.who_to_follow.follow_button')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Trending */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">{t('right_sidebar.trending.title')}</h2>
        {trendingTags.length === 0 ? (
          <p className="text-sm text-gray-500">No trending tags yet.</p>
        ) : (
          <ul className="space-y-2">
            {trendingTags.map(({ tag }) => (
              <li key={tag}>
                <Link
                  href={`/explore?q=${encodeURIComponent('#' + tag)}`}
                  className="text-brand text-sm font-medium hover:underline"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
