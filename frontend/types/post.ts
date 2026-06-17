import { User } from './user';
import type { AuthUser } from '@/context/AuthContext';

export interface Reply {
  id: string;
  author: User;
  content: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  tags?: string[];
  imageUrl?: string;
  repostsCount: number;
  isLiked?: boolean;
  replies?: Reply[];
}

// Raw shapes returned by the backend API
export interface BackendPost {
  _id: string;
  authorId: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  tags?: string[];
  createdAt: string;
}

export interface BackendComment {
  _id: string;
  user_id: string;
  content: string;
  createdAt: string;
}

export function mapBackendPost(
  bp: BackendPost,
  likedIds: Set<string>,
  currentUser: AuthUser,
  authorMap: Map<string, string> = new Map()
): Post {
  const isCurrentUser = bp.authorId === currentUser.id;
  const username = isCurrentUser
    ? currentUser.username
    : (authorMap.get(bp.authorId) ?? bp.authorId);
  const author: User = {
    id: bp.authorId,
    name: username,
    username,
    avatarUrl: `https://i.pravatar.cc/150?u=${bp.authorId}`,
  };

  return {
    id: bp._id,
    author,
    content: bp.content,
    createdAt: bp.createdAt,
    likesCount: bp.likesCount,
    commentsCount: bp.commentsCount,
    tags: bp.tags,
    repostsCount: 0,
    isLiked: likedIds.has(bp._id),
  };
}

export function mapBackendComment(bc: BackendComment, currentUser: AuthUser): Reply {
  const isCurrentUser = bc.user_id === currentUser.id;
  return {
    id: bc._id,
    author: isCurrentUser
      ? { id: currentUser.id, name: currentUser.username, username: currentUser.username, avatarUrl: `https://i.pravatar.cc/150?u=${currentUser.id}` }
      : { id: bc.user_id, name: bc.user_id, username: bc.user_id, avatarUrl: `https://i.pravatar.cc/150?u=${bc.user_id}` },
    content: bc.content,
  };
}
