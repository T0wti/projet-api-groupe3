import api from '../api';
import type { BackendPost, BackendComment } from '@/types/post';

export async function fetchPosts(): Promise<BackendPost[]> {
  const res = await api.get<BackendPost[]>('/posts');
  return res.data;
}

export async function fetchFeedPosts(authorIds: string[]): Promise<BackendPost[]> {
  const res = await api.get<BackendPost[]>('/posts/feed', {
    params: { authorIds: authorIds.join(',') },
  });
  return res.data;
}

export async function fetchUserLikedPostIds(userId: string): Promise<string[]> {
  const res = await api.get<{ liked_posts: string[] }>(`/post-likes/user/${userId}`);
  return res.data.liked_posts.map(String);
}

export async function createPost(content: string): Promise<BackendPost> {
  const res = await api.post<BackendPost>('/posts', { content });
  return res.data;
}

export async function likePost(postId: string): Promise<void> {
  await api.post('/post-likes', { post_id: postId });
}

export async function unlikePost(postId: string): Promise<void> {
  await api.delete('/post-likes', { data: { post_id: postId } });
}

export async function searchPosts(q: string): Promise<BackendPost[]> {
  const res = await api.get<BackendPost[]>('/posts/search', { params: { q } });
  return res.data;
}

export async function fetchPostsByTag(tag: string): Promise<BackendPost[]> {
  const res = await api.get<BackendPost[]>(`/posts/tags/${encodeURIComponent(tag)}`);
  return res.data;
}

export async function fetchComments(postId: string): Promise<BackendComment[]> {
  const res = await api.get<BackendComment[]>(`/comments/post/${postId}`);
  return res.data;
}

export async function createComment(postId: string, content: string): Promise<BackendComment> {
  const res = await api.post<BackendComment>('/comments', { post_id: postId, content });
  return res.data;
}
