"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar';
import { fetchFollowersById, fetchFollowingById } from '@/lib/api/profile';
import { fetchPublicUserById } from '@/lib/api/users';
import { fetchProfileById } from '@/lib/api/profile';

interface FollowUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface FollowListModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export default function FollowListModal({ userId, type, onClose }: FollowListModalProps) {
  const { t } = useTranslation('profile');
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ids = type === 'followers'
          ? await fetchFollowersById(userId)
          : await fetchFollowingById(userId);

        const [userResults, profileResults] = await Promise.all([
          Promise.allSettled(ids.map(fetchPublicUserById)),
          Promise.allSettled(ids.map(fetchProfileById)),
        ]);

        const enriched: FollowUser[] = ids.map((id, i) => {
          const userRes = userResults[i];
          const profileRes = profileResults[i];
          const username = userRes.status === 'fulfilled' ? userRes.value.username : id;
          const avatarUrl = profileRes.status === 'fulfilled' ? profileRes.value.avatar_url : undefined;
          return { id, username, avatarUrl };
        });

        setUsers(enriched);
      } catch {
        // fail silently — empty list shown
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [userId, type]);

  const title = type === 'followers'
    ? t('follow_list.followers_title')
    : t('follow_list.following_title');

  const emptyMessage = type === 'followers'
    ? t('follow_list.empty_followers')
    : t('follow_list.empty_following');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading && (
            <p className="text-center text-gray-400 py-8 text-sm">{t('loading_message')}</p>
          )}

          {!isLoading && users.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">{emptyMessage}</p>
          )}

          {!isLoading && users.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${encodeURIComponent(u.username)}`}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <Avatar src={u.avatarUrl} alt={u.username} size="sm" />
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{u.username}</p>
                <p className="text-gray-500 text-sm truncate">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
