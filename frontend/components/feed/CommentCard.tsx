"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Heart, ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '@/components/ui/Avatar';
import ContextMenu from '@/components/ui/ContextMenu';
import { Reply } from '@/types/post';
import { useAuth } from '@/context/AuthContext';
import { useMediaPicker } from '@/hooks/useMediaPicker';
import MediaPreview from '@/components/ui/MediaPreview';
import { confirmDelete } from '@/lib/utils/alerts';

interface CommentCardProps {
  comment: Reply;
  onLike?: () => void;
  onUnlike?: () => void;
  onReply?: (content: string, media: File | null) => void;
  onEdit?: (newContent: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  disableNavigation?: boolean;
  isPosting?: boolean;
}

export default function CommentCard({ comment, onLike, onUnlike, onReply, onEdit, onDelete, disableNavigation, isPosting = false }: CommentCardProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const profileHref = `/profile/${encodeURIComponent(comment.author.username)}`;
  const isAuthor = !!user && comment.author.id === user.id;
  const showMenu = isAuthor && (onEdit !== undefined || onDelete !== undefined);

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

  const handleSaveEdit = async () => {
    if (!onEdit || !editContent.trim()) return;
    await onEdit(editContent.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    const confirmed = await confirmDelete({
      title: t('post_card.delete_confirm'),
      confirmText: t('post_card.delete'),
      cancelText: t('compose_post.cancel'),
    });
    if (confirmed) await onDelete();
  };

  const menuActions = [
    ...(onEdit ? [{ label: t('profile:comment.edit'), onClick: () => { setIsEditing(true); setEditContent(comment.content); } }] : []),
    ...(onDelete ? [{ label: t('profile:comment.delete'), onClick: handleDeleteClick, danger: true }] : []),
  ];

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
          <div className="flex items-center justify-between gap-1 text-sm">
            <Link href={profileHref} className="flex items-center gap-1">
              <span className="font-bold app-text">{comment.author.name}</span>
              <span className="app-text-muted">@{comment.author.username}</span>
            </Link>
            {showMenu && (
              <div onClick={(e) => e.stopPropagation()}>
                <ContextMenu ariaLabel={t('accessibility.comment_options')} actions={menuActions} />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                autoFocus
                className="w-full resize-none rounded-lg border app-input p-2 text-sm outline-none focus:border-brand"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                  className="rounded-full bg-brand px-4 py-1 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {t('profile:comment.save')}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full border app-border px-4 py-1 text-sm font-semibold app-text app-hover-surface"
                >
                  {t('profile:comment.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 app-text text-[15px] whitespace-pre-wrap wrap-break-word">{comment.content}</p>
          )}

          {comment.imageUrl && !isEditing && (
            <div className="mt-3 w-full overflow-hidden border app-border rounded-2xl flex justify-center items-center">
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
