import Image from 'next/image';
import { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <img 
            src={post.author.avatarUrl} 
            alt={post.author.username} 
            className="w-10 h-10 rounded-full"
          />
        </div>

        {/* Post Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold text-gray-900">{post.author.name}</span>
            <span className="text-gray-500">@{post.author.username}</span>
            <span className="text-gray-500">· {post.createdAt}</span>
          </div>

          {/* Text Content */}
          <p className="mt-1 text-gray-900 text-[15px] whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Optional Image */}
          {post.imageUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
              <img src={post.imageUrl} alt="Post media" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* Action Buttons (Placeholders for Fx6, Fx7) */}
          <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
            <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
              <span>💬</span> {post.commentsCount}
            </button>
            <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
              <span>🔁</span> {post.repostsCount}
            </button>
            <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
              <span>❤️</span> {post.likesCount}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}