'use client';

import { AxiosError } from 'axios';
import { useState } from 'react';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import MediaPreview from '@/components/ui/MediaPreview';
import { useAuth } from '@/context/AuthContext';
import { useMediaPicker } from '@/hooks/useMediaPicker';
import { createPost } from '@/lib/api/posts';
import { uploadMedia } from '@/lib/api/media';
import { toastSuccess } from '@/lib/utils/alerts';
import type { BackendPost } from '@/types/post';

type TriggerVariant = 'sidebar' | 'mobile';

interface PublishPostModalProps {
  triggerVariant: TriggerVariant;
}

declare global {
  interface WindowEventMap {
    'breezy:post-created': CustomEvent<BackendPost>;
  }
}

export default function PublishPostModal({ triggerVariant }: PublishPostModalProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remainingCharacters = 280 - content.length;
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

  const closeModal = () => {
    if (isPosting) return;
    setIsOpen(false);
    setContent('');
    setError(null);
    reset();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || (content.trim().length === 0 && !selectedFile) || isPosting) {
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const tags = [...new Set([...content.matchAll(/\B#(\w+)/g)].map((match) => match[1].toLowerCase()))];
      let uploadedImageUrl: string | null = null;
      let uploadedObjectName: string | null = null;
      if (selectedFile) {
        const { url, object_name } = await uploadMedia(selectedFile);
        uploadedImageUrl = url;
        uploadedObjectName = object_name;
      }
      const newPost = await createPost(content, tags.length > 0 ? tags : undefined, uploadedImageUrl, uploadedObjectName);
      window.dispatchEvent(new CustomEvent('breezy:post-created', { detail: newPost }));
      closeModal();
      toastSuccess(t('compose_post.success'));
    } catch (caughtError: unknown) {
      const message = caughtError instanceof AxiosError
        && typeof caughtError.response?.data === 'object'
        && caughtError.response?.data !== null
        && 'message' in caughtError.response.data
        ? String(caughtError.response.data.message)
        : t('compose_post.publish_error');
      setError(message);
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {triggerVariant === 'sidebar' ? (
        <Button className="mt-6" variant="primary" size="lg" onClick={() => setIsOpen(true)}>
          <Plus size={20} className="block lg:hidden" />
          <span className="hidden lg:block">{t('sidebar.post_button')}</span>
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-brand text-white rounded-full p-2 hover:bg-brand-hover transition-colors"
          aria-label={t('sidebar.post_button')}
        >
          <Plus size={24} />
        </button>
      )}

      {typeof document !== 'undefined' && isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center app-overlay px-0 py-0 sm:items-center sm:px-4 sm:py-8">
          <div className="flex h-[min(100dvh,48rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-b-0 border-x-0 app-border app-surface-elevated shadow-[0_30px_80px_rgba(15,23,42,0.25)] sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:rounded-[2rem] sm:border">
            <div className="flex items-start justify-between border-b app-border px-4 py-4 sm:items-center sm:px-6">
              <div>
                <h2 className="text-lg font-black app-text sm:text-xl">{t('compose_post.modal_title')}</h2>
                <p className="mt-1 pr-4 text-sm app-text-muted">{t('compose_post.modal_description')}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPosting}
                className="rounded-full p-2 app-text-muted transition-colors hover:app-text app-hover-surface disabled:cursor-not-allowed"
                aria-label={t('compose_post.close')}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex min-h-0 flex-1 gap-3 sm:gap-4">
                <div className="hidden sm:block">
                  <Avatar src={user.avatarUrl} alt={t('accessibility.avatar_self')} size="md" />
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder={t('compose_post.placeholder')}
                      className="min-h-32 w-full resize-none rounded-[1.25rem] border app-input px-4 py-4 text-base outline-none transition-colors placeholder:app-text-muted focus:border-brand sm:min-h-40 sm:rounded-[1.5rem] sm:px-5"
                      maxLength={280}
                      autoFocus
                    />

                    {previewUrl && selectedFile && (
                      <div className="mt-4">
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
                      </div>
                    )}

                    {error && (
                      <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-[1.25rem] border app-border-subtle app-surface-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-[1.5rem]">
                    <div className="flex items-center justify-between gap-3 text-sm app-text-muted sm:justify-start">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleIconClick}
                          disabled={isPosting}
                          className="rounded-full p-1 text-brand transition-colors hover:bg-brand/10 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t('compose_post.submit_button')}
                        >
                          <ImageIcon size={18} className="text-brand" />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm"
                          className="hidden"
                        />
                        <span>
                          {t(
                            remainingCharacters === 1
                              ? 'compose_post.characters_left_one'
                              : 'compose_post.characters_left_other',
                            { count: remainingCharacters }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-3 sm:w-auto">
                      <Button type="button" variant="ghost" onClick={closeModal} disabled={isPosting} className="flex-1 sm:flex-none">
                        {t('compose_post.cancel')}
                      </Button>
                      <Button type="submit" disabled={(content.trim().length === 0 && !selectedFile) || isPosting} className="flex-1 sm:flex-none">
                        {isPosting ? t('compose_post.publishing') : t('compose_post.submit_button')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
