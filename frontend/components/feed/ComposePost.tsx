"use client"; // Required because we use React state and event listeners

import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

// 1. Define the props this component expects
// TODO: Change this when API WORKS
interface ComposePostProps {
  onPost: (content: string) => Promise<void>;
  isPosting?: boolean;
}

export default function ComposePost({ onPost, isPosting = false }: ComposePostProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length === 0 || isPosting) return;
    await onPost(content);
    setContent('');
  };

  return (
    <div className="border-b border-gray-200 p-4 px-12">
      <div className="flex gap-3">
        <Avatar
          src={`https://i.pravatar.cc/150?u=${user?.id ?? 'anon'}`}
          alt="My Avatar"
          size="md"
        />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('compose_post.placeholder')}
            className="w-full bg-transparent text-xl outline-none resize-none min-h-15 placeholder-gray-500"
            maxLength={280}
          />
          <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
            <div className="text-brand">
              <ImageIcon size={20} />
            </div>
            <Button
              type="submit"
              disabled={content.trim().length === 0 || isPosting}
              className="bg-brand hover:bg-brand-hover text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50"
            >
              {isPosting ? '...' : t('compose_post.submit_button')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}