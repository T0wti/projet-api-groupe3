"use client";

import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useMediaPicker } from '@/src/hooks/useMediaPicker';
import MediaPreview from '@/components/ui/MediaPreview';

interface ComposePostProps {
  onPost: (content: string, image: File | null) => Promise<void>;
  isPosting?: boolean;
}

export default function ComposePost({ onPost, isPosting = false }: ComposePostProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const {
    selectedFile,
    previewUrl,
    isCropping,
    srcUrl,
    crop,
    isVideo,
    isGif,
    fileInputRef,
    imgRef,
    handleIconClick,
    handleFileChange,
    handleTriggerCrop,
    onImageLoad,
    handleCropComplete,
    handleRemoveImage,
    cancelCrop,
    setCrop,
    setCompletedCrop,
    reset,
  } = useMediaPicker();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((content.trim().length === 0 && !selectedFile) || isPosting) return;

    await onPost(content, selectedFile);
    setContent('');
    reset();
  };

  return (
    <div className="border-b app-border p-4 px-12">
      <div className="flex gap-3">
        <Avatar
          src={user?.avatarUrl}
          alt={t('accessibility.avatar_self')}
          size="md"
        />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('compose_post.placeholder')}
            className="w-full bg-transparent text-xl outline-none resize-none min-h-15 app-text placeholder:app-text-muted"
            maxLength={280}
          />

          {previewUrl && selectedFile && (
            <MediaPreview
              previewUrl={previewUrl}
              isVideo={isVideo}
              isGif={isGif}
              onTriggerCrop={handleTriggerCrop}
              onRemove={handleRemoveImage}
              isCropping={isCropping}
              srcUrl={srcUrl}
              crop={crop}
              imgRef={imgRef}
              onImageLoad={onImageLoad}
              onCropChange={setCrop}
              onCropComplete={setCompletedCrop}
              onCropSave={handleCropComplete}
              onCropCancel={cancelCrop}
            />
          )}

          <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2">
            <div
              className="text-brand cursor-pointer hover:opacity-80 p-1 rounded-full hover:bg-brand/10 transition-colors"
              onClick={handleIconClick}
            >
              <ImageIcon size={20} />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm"
                className="hidden"
              />
            </div>
            <Button
              type="submit"
              disabled={(content.trim().length === 0 && !selectedFile) || isPosting}
              className="bg-brand hover:bg-brand-hover text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50"
            >
              {isPosting ? t('compose_post.publishing') : t('compose_post.submit_button')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}