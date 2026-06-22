"use client";

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Heart, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar';
import { Reply } from '@/types/post';
import { useMediaPicker } from '@/src/hooks/useMediaPicker';
import MediaPreview from '@/components/ui/MediaPreview';

interface CommentCardProps {
  comment: Reply;
  onLike?: () => void;
  onUnlike?: () => void;
  onReply?: (content: string, media: File | null) => void;
  disableNavigation?: boolean;
  isPosting?: boolean;
}

export default function CommentCard({ comment, onLike, onUnlike, onReply, disableNavigation, isPosting = false }: CommentCardProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const profileHref = `/profile/${encodeURIComponent(comment.author.username)}`;

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

  const handleCardClick = () => {
    if (disableNavigation) return;
    router.push(`/comments/${comment.id}`);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (comment.isLiked) {
      onUnlike?.();
    } else {
      onLike?.();
    }
  };

  const submitReply = async () => {
    if (!replyText.trim() || !onReply) return;
    onReply(replyText, selectedFile);
    setReplyText('');
    reset();
    setIsReplying(false);
  };

  const isVideoUrl = comment.imageUrl
    ? /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(comment.imageUrl)
    : false;

  return (
    <article
      className={`app-surface border-b app-border-subtle px-4 py-3 app-hover-surface transition-colors${disableNavigation ? '' : ' cursor-pointer'}`}
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        <div className="shrink-0">
          <Link href={profileHref} aria-label={t('accessibility.view_profile', { username: comment.author.username })}>
            <Avatar src={comment.author.avatarUrl} alt={comment.author.username} size="sm" />
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm">
            <Link href={profileHref} className="flex items-center gap-1">
              <span className="font-bold app-text">{comment.author.name}</span>
              <span className="app-text-muted">@{comment.author.username}</span>
            </Link>
          </div>

          <p className="mt-1 app-text text-[15px] whitespace-pre-wrap wrap-break-word">{comment.content}</p>

          {comment.imageUrl && (
            <div className="mt-3 w-full overflow-hidden border border-gray-100 rounded-2xl flex justify-center items-center">
              {isVideoUrl ? (
                <video
                  src={comment.imageUrl}
                  controls
                  preload="metadata"
                  className="w-full object-contain max-h-[30vh]"
                />
              ) : (
                <img
                  src={comment.imageUrl}
                  alt="Contenu du comment"
                  className="w-full object-contain max-h-[30vh]"
                  loading="lazy"
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-6 mt-2">
            {onReply !== undefined && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsReplying(!isReplying); }}
                className="post-action hover:text-blue-500"
              >
                <MessageCircle size={16} />
                <span className="text-sm">{comment.commentsCount}</span>
              </button>
            )}

            {(onLike !== undefined || onUnlike !== undefined) && (
              <button
                onClick={handleToggleLike}
                className={`post-action ${comment.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
              >
                <Heart size={16} className={comment.isLiked ? 'fill-red-500' : ''} />
                <span className="text-sm">{comment.likesCount}</span>
              </button>
            )}
          </div>

          {isReplying && (
            <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('post_card.reply_placeholder')}
                  className="inline-input"
                />
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
                <button
                  onClick={submitReply}
                  disabled={!replyText.trim() || isPosting}
                  className="bg-brand text-white px-4 py-1 rounded-full text-sm font-bold disabled:opacity-50"
                >
                  {t('post_card.reply_button')}
                </button>
              </div>

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
            </div>
          )}
        </div>
      </div>
    </article>
  );
}