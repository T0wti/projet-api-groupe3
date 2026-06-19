"use client";

import Link from 'next/link';
import { useState } from 'react';
import { MessageCircle, Repeat2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from "@/components/ui/Avatar";
import { useAuth } from '@/context/AuthContext';
import { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onReply: (content: string) => void;
}

export default function PostCard({ post, onLike, onReply }: PostCardProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const profileHref = `/profile/${encodeURIComponent(post.author.username)}`;
  const avatarSrc = post.author.id === user?.id ? (user.avatarUrl ?? post.author.avatarUrl) : post.author.avatarUrl;

  const TRUNCATE_LIMIT = 140;
  const isTruncatable = post.content.length > TRUNCATE_LIMIT;
  const displayContent = isTruncatable && !expanded
    ? post.content.slice(0, TRUNCATE_LIMIT) + '…'
    : post.content;

  const submitReply = () => {
    if (replyText.trim().length === 0) return;
    onReply(replyText);
    setReplyText('');
    setIsReplying(false);
  };

  return (
    <article className="bg-white border border-gray-200 p-4 hover:bg-gray-50 transition-colors rounded-lg">
      <div className="flex gap-3">
        <div className="shrink-0">
          <Link href={profileHref} aria-label={`Voir le profil de ${post.author.username}`}>
            <Avatar src={avatarSrc} alt={post.author.username} size="md" />
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          <Link href={profileHref} className="flex items-center gap-1 text-sm w-max">
            <span className="font-bold text-gray-900">{post.author.name}</span>
            <span className="text-gray-500">@{post.author.username}</span>
          </Link>

          <p className="mt-1 text-gray-900 text-[15px] whitespace-pre-wrap wrap-break-word">{displayContent}</p>
          {isTruncatable && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-brand text-sm font-semibold mt-1 hover:underline"
            >
              {expanded ? t('post_card.show_less') : t('post_card.show_more')}
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-8 mt-3">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="post-action hover:text-blue-500"
            >
              <MessageCircle size={18} />
              <span className="text-sm">{post.commentsCount}</span>
            </button>

            <button
              onClick={onLike}
              className={`post-action ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <Heart size={18} className={post.isLiked ? 'fill-red-500' : ''} />
              <span className="text-sm">{post.likesCount}</span>
            </button>
          </div>

          {isReplying && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('post_card.reply_placeholder')}
                className="inline-input"
              />
              <button
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="bg-brand text-white px-4 py-1 rounded-full text-sm font-bold disabled:opacity-50"
              >
                {t('post_card.reply_button')}
              </button>
            </div>
          )}

          {post.replies && post.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
              {post.replies.map((reply) => (
                <div key={reply.id} className="text-sm">
                  <span className="font-bold mr-2">{reply.author.name}</span>
                  <span className="text-gray-700">{reply.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}