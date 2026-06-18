"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ComposePost from '@/components/feed/ComposePost';
import PostCard from '@/components/feed/PostCard';
import { useAuth } from '@/context/AuthContext';
import { Post, Reply, mapBackendPost, mapBackendComment } from '@/types/post';
import {
  fetchPosts,
  fetchUserLikedPostIds,
  createPost,
  likePost,
  unlikePost,
  createComment,
} from '@/lib/api/posts';
import { fetchPublicUserById } from '@/lib/api/users';

export default function HomeFeed() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('common');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve before doing anything
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    async function loadFeed() {
      try {
        const [backendPosts, likedIds] = await Promise.all([
          fetchPosts(),
          fetchUserLikedPostIds(user!.id),
        ]);
        const likedSet = new Set(likedIds);

        // Fetch usernames for authors that are not the current user
        const otherAuthorIds = [...new Set(
          backendPosts.map((p) => p.authorId).filter((id) => id !== user!.id)
        )];
        const profiles = await Promise.allSettled(otherAuthorIds.map(fetchPublicUserById));
        const authorMap = new Map<string, string>();
        profiles.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            authorMap.set(otherAuthorIds[i], result.value.username);
          }
        });

        setPosts(backendPosts.map((bp) => mapBackendPost(bp, likedSet, user!, authorMap)));
      } catch {
        setError('Failed to load posts.');
      } finally {
        setIsLoading(false);
      }
    }

    loadFeed();
  }, [user, authLoading]);

  const handleAddNewPost = async (content: string) => {
    if (!user) return;
    setIsPosting(true);
    setPostError(null);
    try {
      const bp = await createPost(content);
      const newPost = mapBackendPost(bp, new Set(), user);
      setPosts((prev) => [newPost, ...prev]);
    } catch (err: any) {
      setPostError(err?.response?.data?.message ?? 'Failed to publish post.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked ?? false;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !wasLiked, likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    );

    try {
      if (wasLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: wasLiked, likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1 }
            : p
        )
      );
    }
  };

  const handleReply = async (postId: string, replyContent: string) => {
    if (!user) return;
    try {
      const bc = await createComment(postId, replyContent);
      const newReply: Reply = mapBackendComment(bc, user);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, replies: [...(p.replies ?? []), newReply], commentsCount: p.commentsCount + 1 }
            : p
        )
      );
    } catch {
      // silently fail
    }
  };

  return (
    <main className="w-full border-x border-gray-200 min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold">{t('home_page.title')}</h1>
      </header>

      <ComposePost onPost={handleAddNewPost} isPosting={isPosting} />

      {postError && (
        <p className="text-center text-red-500 py-2 px-4 text-sm">{postError}</p>
      )}

      {isLoading && (
        <p className="text-center text-gray-400 py-8">Loading...</p>
      )}

      {error && (
        <p className="text-center text-red-500 py-8">{error}</p>
      )}

      <section className="px-10 py-5 space-y-5">
        {posts.map((post) => {
          const PostCardAny = PostCard as any;
          return (
            <PostCardAny
              key={post.id}
              post={post}
              onLike={() => handleToggleLike(post.id)}
              onReply={(content: string) => handleReply(post.id, content)}
            />
          );
        })}
      </section>
    </main>
  );
}
