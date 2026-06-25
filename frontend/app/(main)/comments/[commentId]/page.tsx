"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CommentCard from '@/components/feed/CommentCard';
import { useAuth } from '@/context/AuthContext';
import { Reply, mapBackendComment } from '@/types/post';
import {
  fetchCommentById,
  fetchCommentReplies,
  fetchUserLikedCommentIds,
  likeComment,
  unlikeComment,
  createComment,
  updateComment,
  deleteComment,
} from '@/lib/api/posts';
import { uploadMedia } from '@/lib/api/media';
import { enrichAuthors } from '@/lib/utils/enrichAuthors';
import { toastSuccess, toastError } from '@/lib/utils/alerts';

export default function CommentDetailPage() {
  const { commentId } = useParams<{ commentId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('common');

  const [comment, setComment] = useState<Reply | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPageLoading = authLoading || (Boolean(user) && isLoading);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !commentId) return;

    async function load() {
      try {
        const [bc, backendReplies, likedIds] = await Promise.all([
          fetchCommentById(commentId),
          fetchCommentReplies(commentId),
          fetchUserLikedCommentIds(user!.id),
        ]);

        const likedSet = new Set(likedIds);

        const focalAuthorIds = bc.user_id !== user!.id ? [bc.user_id] : [];
        const { authorMap: fAuthorMap, avatarMap: fAvatarMap } = await enrichAuthors(focalAuthorIds);
        setComment(mapBackendComment(bc, user!, fAuthorMap, fAvatarMap, likedSet));

        const replyAuthorIds = [...new Set(
          backendReplies.map(r => r.user_id).filter(id => id !== user!.id)
        )];
        const { authorMap: rAuthorMap, avatarMap: rAvatarMap } = await enrichAuthors(replyAuthorIds);
        setReplies(backendReplies.map(r => mapBackendComment(r, user!, rAuthorMap, rAvatarMap, likedSet)));
      } catch {
        setError(t('comment_detail.load_error'));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, authLoading, commentId, t]);

  const handleLikeComment = async () => {
    if (!comment) return;
    setComment(prev => prev ? { ...prev, isLiked: true, likesCount: prev.likesCount + 1 } : prev);
    try {
      await likeComment(comment.id);
    } catch {
      setComment(prev => prev ? { ...prev, isLiked: false, likesCount: prev.likesCount - 1 } : prev);
    }
  };

  const handleUnlikeComment = async () => {
    if (!comment) return;
    setComment(prev => prev ? { ...prev, isLiked: false, likesCount: prev.likesCount - 1 } : prev);
    try {
      await unlikeComment(comment.id);
    } catch {
      setComment(prev => prev ? { ...prev, isLiked: true, likesCount: prev.likesCount + 1 } : prev);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    setReplies(prev => prev.map(r => r.id === replyId ? { ...r, isLiked: true, likesCount: r.likesCount + 1 } : r));
    try {
      await likeComment(replyId);
    } catch {
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, isLiked: false, likesCount: r.likesCount - 1 } : r));
    }
  };

  const handleUnlikeReply = async (replyId: string) => {
    setReplies(prev => prev.map(r => r.id === replyId ? { ...r, isLiked: false, likesCount: r.likesCount - 1 } : r));
    try {
      await unlikeComment(replyId);
    } catch {
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, isLiked: true, likesCount: r.likesCount + 1 } : r));
    }
  };

  const handleEditComment = async (newContent: string) => {
    if (!comment) return;
    try {
      await updateComment(comment.id, newContent);
      setComment((prev) => prev ? { ...prev, content: newContent } : prev);
      toastSuccess(t('post_card.edit_success'));
    } catch {
      toastError(t('post_card.edit_error'));
    }
  };

  const handleDeleteComment = async () => {
    if (!comment) return;
    try {
      await deleteComment(comment.id);
      router.back();
    } catch {
      toastError(t('post_card.delete_error'));
    }
  };

  const handleEditReply = async (replyId: string, newContent: string) => {
    try {
      await updateComment(replyId, newContent);
      setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, content: newContent } : r));
      toastSuccess(t('post_card.edit_success'));
    } catch {
      toastError(t('post_card.edit_error'));
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteComment(replyId);
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      setComment((prev) => prev ? { ...prev, commentsCount: prev.commentsCount - 1 } : prev);
      toastSuccess(t('post_card.delete_success'));
    } catch {
      toastError(t('post_card.delete_error'));
    }
  };

  const handleReply = async (content: string, image: File | null) => {
    if (!user || !comment) return;
    try {
      let uploadedImageUrl: string | null = null;
      let uploadedObjectName: string | null = null;
      if (image) {
        const { url, object_name } = await uploadMedia(image);
        uploadedImageUrl = url;
        uploadedObjectName = object_name;
      }
      const bc = await createComment(comment.postId, content, uploadedImageUrl, comment.id, uploadedObjectName);
      const newReply = mapBackendComment(bc, user);
      setReplies(prev => [newReply, ...prev]);
      setComment(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev);
    } catch {
      // silently fail
    }
  };

  return (
    <main className="w-full border-x app-border app-page min-h-screen">
      <header className="sticky top-0 z-10 app-header backdrop-blur-md border-b app-border px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="app-text-muted hover:app-text transition-colors"
          aria-label={t('accessibility.go_back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t('comment_detail.title')}</h1>
      </header>

      {isPageLoading && <p className="text-center app-text-soft py-8">{t('pending')}</p>}
      {error && <p className="text-center text-red-500 py-8">{error}</p>}

      {!isPageLoading && !error && comment && (
        <>
          <div className="border-b app-border">
            <CommentCard
              comment={comment}
              onLike={handleLikeComment}
              onUnlike={handleUnlikeComment}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              disableNavigation
            />
          </div>

          <section>
            {replies.length === 0 && (
              <p className="text-center app-text-soft py-10">{t('post_card.no_comments')}</p>
            )}
            {replies.map(reply => (
              <CommentCard
                key={reply.id}
                comment={reply}
                onLike={() => handleLikeReply(reply.id)}
                onUnlike={() => handleUnlikeReply(reply.id)}
                onReply={(content: string, image: File | null) => handleReply(content, image)}
                onEdit={(newContent) => handleEditReply(reply.id, newContent)}
                onDelete={() => handleDeleteReply(reply.id)}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
