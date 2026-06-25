"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PostCard from '@/components/feed/PostCard';
import CommentCard from '@/components/feed/CommentCard';
import { useAuth } from '@/context/AuthContext';
import { Post, Reply, mapBackendPost, mapBackendComment } from '@/types/post';
import {
  fetchPostById,
  fetchComments,
  fetchUserLikedPostIds,
  fetchUserLikedCommentIds,
  likePost,
  unlikePost,
  likeComment,
  unlikeComment,
  createComment,
  updateComment,
  deleteComment,
} from '@/lib/api/posts';
import { uploadMedia } from '@/lib/api/media';
import { enrichAuthors } from '@/lib/utils/enrichAuthors';
import { toastSuccess, toastError } from '@/lib/utils/alerts';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('common');

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPageLoading = authLoading || (Boolean(user) && isLoading);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !postId) return;

    async function load() {
      try {
        const [{ post: bp }, likedIds, backendComments, likedCommentIds] = await Promise.all([
          fetchPostById(postId),
          fetchUserLikedPostIds(user!.id),
          fetchComments(postId),
          fetchUserLikedCommentIds(user!.id),
        ]);

        const postAuthorIds = bp.authorId !== user!.id ? [bp.authorId] : [];
        const { authorMap, avatarMap } = await enrichAuthors(postAuthorIds);
        setPost(mapBackendPost(bp, new Set(likedIds), user!, authorMap, avatarMap));

        const commentAuthorIds = [...new Set(
          backendComments.map(c => c.user_id).filter(id => id !== user!.id)
        )];
        const { authorMap: cAuthorMap, avatarMap: cAvatarMap } = await enrichAuthors(commentAuthorIds);

        const likedCommentSet = new Set(likedCommentIds);
        setComments(backendComments.filter(bc => !bc.parent_comment_id).map(bc =>
          mapBackendComment(bc, user!, cAuthorMap, cAvatarMap, likedCommentSet)
        ));
      } catch {
        setError(t('post_detail.load_error'));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, authLoading, postId, t]);

  const handleToggleLike = async () => {
    if (!post) return;
    const wasLiked = post.isLiked ?? false;
    setPost(prev => prev ? { ...prev, isLiked: !wasLiked, likesCount: wasLiked ? prev.likesCount - 1 : prev.likesCount + 1 } : prev);
    try {
      if (wasLiked) await unlikePost(post.id);
      else await likePost(post.id);
    } catch {
      setPost(prev => prev ? { ...prev, isLiked: wasLiked, likesCount: wasLiked ? prev.likesCount + 1 : prev.likesCount - 1 } : prev);
    }
  };

  const handleReply = async (content: string, image: File | null) => {
    if (!user || !post) return;
    try {
      let uploadedImageUrl: string | null = null;
      let uploadedObjectName: string | null = null;
      if (image) {
        const { url, object_name } = await uploadMedia(image);
        uploadedImageUrl = url;
        uploadedObjectName = object_name;
      }
      const bc = await createComment(post.id, content, uploadedImageUrl, undefined, uploadedObjectName);
      const newComment = mapBackendComment(bc, user);
      setComments(prev => [newComment, ...prev]);
      setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev);
    } catch {
      // silently fail
    }
  };

  const handleLikeComment = async (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, isLiked: true, likesCount: c.likesCount + 1 } : c));
    try {
      await likeComment(commentId);
    } catch {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isLiked: false, likesCount: c.likesCount - 1 } : c));
    }
  };

  const handleUnlikeComment = async (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, isLiked: false, likesCount: c.likesCount - 1 } : c));
    try {
      await unlikeComment(commentId);
    } catch {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isLiked: true, likesCount: c.likesCount + 1 } : c));
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      await updateComment(commentId, newContent);
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content: newContent } : c));
      toastSuccess(t('post_card.edit_success'));
    } catch {
      toastError(t('post_card.edit_error'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toastSuccess(t('post_card.delete_success'));
    } catch {
      toastError(t('post_card.delete_error'));
    }
  };

  const handleReplyToComment = async (parentCommentId: string, content: string, image: File | null) => {
    if (!user || !post) return;
    try {
      let uploadedImageUrl: string | null = null;
      let uploadedObjectName: string | null = null;
      if (image) {
        const { url, object_name } = await uploadMedia(image);
        uploadedImageUrl = url;
        uploadedObjectName = object_name;
      }
      await createComment(post.id, content, uploadedImageUrl, parentCommentId, uploadedObjectName);
      setComments(prev => prev.map(c =>
        c.id === parentCommentId ? { ...c, commentsCount: c.commentsCount + 1 } : c
      ));
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
        <h1 className="text-xl font-bold">{t('post_detail.title')}</h1>
      </header>

      {isPageLoading && <p className="text-center app-text-soft py-8">{t('pending')}</p>}
      {error && <p className="text-center text-red-500 py-8">{error}</p>}

      {!isPageLoading && !error && post && (
        <>
          <div className="px-4 py-4 border-b app-border">
            <PostCard
              post={post}
              onLike={handleToggleLike}
              onReply={handleReply}
              disableNavigation
            />
          </div>

          <section>
            {comments.length === 0 && (
              <p className="text-center app-text-soft py-10">{t('post_card.no_comments')}</p>
            )}
            {comments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onLike={() => handleLikeComment(comment.id)}
                onUnlike={() => handleUnlikeComment(comment.id)}
                onReply={(content: string, image: File | null) => handleReplyToComment(comment.id, content, image)}
                onEdit={(newContent) => handleEditComment(comment.id, newContent)}
                onDelete={() => handleDeleteComment(comment.id)}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
