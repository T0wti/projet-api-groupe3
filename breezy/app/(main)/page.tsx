import ComposePost from '@/components/feed/ComposePost';
import PostCard from '@/components/feed/PostCard';
import { MOCK_POSTS } from '@/lib/utils/mockData';

export default function HomeFeed() {
  return (
    // This container represents the middle column of your layout
    <main className="w-full max-w-150 border-x border-gray-200 min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold">Home</h1>
      </header>

      {/* Compose Area */}
      <ComposePost />

      {/* Feed List */}
      <section>
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </main>
  );
}