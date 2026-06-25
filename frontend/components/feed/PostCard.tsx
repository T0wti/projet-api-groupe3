"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Heart, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from "@/components/ui/Avatar";
import ContextMenu from "@/components/ui/ContextMenu";
import { useAuth } from '@/context/AuthContext';
import { useMediaPicker } from '@/hooks/useMediaPicker';
import MediaPreview from '@/components/ui/MediaPreview';

import { createPostReport } from '@/lib/api/posts';
import { Post, ReportReason } from '@/types/post';
import { confirmDelete, toastSuccess, toastError } from '@/lib/utils/alerts';

const REPORT_REASONS: ReportReason[] = ['spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'misinformation', 'other'];

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onReply: (content: string, image: File | null) => void;
  onEdit?: (postId: string, newContent: string, newImage: File | null) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  disableNavigation?: boolean;
  isPosting?: boolean;
}

export default function PostCard({ post, onLike, onReply, onEdit, onDelete, disableNavigation }: PostCardProps) {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const profileHref = `/profile/${encodeURIComponent(post.author.username)}`;
  const avatarSrc = post.author.id === user?.id ? (user.avatarUrl ?? post.author.avatarUrl) : post.author.avatarUrl;
  const isAuthor = post.author.id === user?.id;
  const showAuthorMenu = isAuthor && (onEdit !== undefined || onDelete !== undefined);
  const canReport = !!user && !isAuthor;
  const showMenu = showAuthorMenu || canReport;

  // Two separate instances of the hook: one for editing, one for replying
  const editPicker = useMediaPicker();
  const replyPicker = useMediaPicker();
  const {
    selectedFile: editSelectedFile,
    previewUrl: editPreviewUrl,
    isCropping: editIsCropping,
    srcUrl: editSrcUrl,
    crop: editCrop,
    isVideo: editIsVideo,
    isGif: editIsGif,
    fileInputRef: editFileInputRef,
    imgRef: editImgRef,
    handleIconClick: handleEditIconClick,
    handleFileChange: handleEditFileChange,
    handleTriggerCrop: handleEditTriggerCrop,
    onImageLoad: onEditImageLoad,
    handleCropComplete: handleEditCropComplete,
    handleRemoveImage: handleEditRemoveImage,
    cancelCrop: cancelEditCrop,
    setCrop: setEditCrop,
    setCompletedCrop: setEditCompletedCrop,
    reset: resetEditPicker,
  } = editPicker;
  const {
    selectedFile: replySelectedFile,
    previewUrl: replyPreviewUrl,
    isCropping: replyIsCropping,
    srcUrl: replySrcUrl,
    crop: replyCrop,
    isVideo: replyIsVideo,
    isGif: replyIsGif,
    fileInputRef: replyFileInputRef,
    imgRef: replyImgRef,
    handleIconClick: handleReplyIconClick,
    handleFileChange: handleReplyFileChange,
    handleTriggerCrop: handleReplyTriggerCrop,
    onImageLoad: onReplyImageLoad,
    handleCropComplete: handleReplyCropComplete,
    handleRemoveImage: handleReplyRemoveImage,
    cancelCrop: cancelReplyCrop,
    setCrop: setReplyCrop,
    setCompletedCrop: setReplyCompletedCrop,
    reset: resetReplyPicker,
  } = replyPicker;

  const TRUNCATE_LIMIT = 140;
  const isTruncatable = post.content.length > TRUNCATE_LIMIT;
  const displayContent = isTruncatable && !expanded
    ? post.content.slice(0, TRUNCATE_LIMIT) + '…'
    : post.content;

  const renderContentWithClickableTags = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const tagRegex = /\B#(\w+)/g;
    let lastIndex = 0;

    for (const match of text.matchAll(tagRegex)) {
      const fullMatch = match[0];
      const tag = match[1];
      const matchIndex = match.index ?? 0;

      if (matchIndex > lastIndex) {
        nodes.push(text.slice(lastIndex, matchIndex));
      }

      nodes.push(
        <Link
          key={`${tag}-${matchIndex}`}
          href={`/explore?q=${encodeURIComponent(`#${tag}`)}`}
          className="font-medium text-blue-500 transition-colors hover:text-blue-600 hover:underline"
        >
          {fullMatch}
        </Link>
      );

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes.length > 0 ? nodes : text;
  };

  const submitReply = () => {
    if (replyText.trim().length === 0 && !replySelectedFile) return;
    onReply(replyText, replySelectedFile);
    setReplyText('');
    resetReplyPicker();
    setIsReplying(false);
  };

  const handleSaveEdit = async () => {
    if (!onEdit || !editContent.trim()) return;
    try {
      await onEdit(post.id, editContent.trim(), editSelectedFile);
      toastSuccess(t('post_card.edit_success'));
    } catch {
      toastError(t('post_card.edit_error'));
    }
    setIsEditing(false);
    resetEditPicker();
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
    resetEditPicker();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (disableNavigation) return;
    if ((e.target as HTMLElement).closest('button, a, input, textarea, video')) return;
    router.push(`/posts/${post.id}`);
  };

  const openReportDialog = () => {
    setReportReason('spam');
    setReportFeedback(null);
    setIsReporting(true);
  };

  const handleSubmitReport = async () => {
    setIsSubmittingReport(true);
    setReportFeedback(null);
    try {
      await createPostReport(post.id, reportReason);
      setIsReporting(false);
      setReportFeedback({ type: 'success', message: t('post_card.report_success') });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('post_card.report_error');
      setReportFeedback({ type: 'error', message });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const menuActions = [
    ...(showAuthorMenu
      ? [
        ...(onEdit ? [{ label: t('post_card.edit'), onClick: () => { setIsEditing(true); setEditContent(post.content); } }] : []),
        ...(onDelete ? [{ label: t('post_card.delete'), onClick: async () => {
          const ok = await confirmDelete({ title: t('post_card.delete_confirm'), confirmText: t('post_card.delete'), cancelText: t('compose_post.cancel') });
          if (ok) {
            try { await onDelete(post.id); toastSuccess(t('post_card.delete_success')); }
            catch { toastError(t('post_card.delete_error')); }
          }
        }, danger: true }] : []),
      ]
      : []),
    ...(canReport ? [{ label: t('post_card.report'), onClick: openReportDialog, danger: true }] : []),
  ];

  const isVideoUrl = post.imageUrl
    ? /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(post.imageUrl)
    : false;

  return (
    <article
      className={`relative app-surface-elevated border app-border p-4 app-hover-surface transition-colors rounded-lg${disableNavigation ? '' : ' cursor-pointer'}`}
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        <div className="shrink-0">
          <Link href={profileHref} aria-label={t('accessibility.view_profile', { username: post.author.username })}>
            <Avatar src={avatarSrc} alt={post.author.username} size="md" />
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Link href={profileHref} className="flex items-center gap-1 text-sm">
              <span className="font-bold app-text">{post.author.name}</span>
              <span className="app-text-muted">@{post.author.username}</span>
            </Link>

            {showMenu && (
              <ContextMenu
                ariaLabel={t('accessibility.post_options')}
                actions={menuActions}
              />
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                autoFocus
                className="w-full resize-none rounded-lg border app-input p-2 text-sm outline-none focus:border-brand"
              />
              <div className="flex gap-2">
                <div
                  className="text-brand cursor-pointer hover:opacity-80 p-1 rounded-full hover:bg-brand/10 transition-colors"
                  onClick={handleEditIconClick}
                >
                  <ImageIcon size={20} />
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditFileChange}
                    accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm"
                    className="hidden"
                  />
                </div>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                  className="rounded-full bg-brand px-4 py-1 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {t('post_card.save')}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full border app-border px-4 py-1 text-sm font-semibold app-text app-hover-surface"
                >
                  {t('post_card.cancel_edit')}
                </button>
              </div>

              {editPreviewUrl && editSelectedFile && (
                <MediaPreview
                  previewUrl={editPreviewUrl}
                  isVideo={editIsVideo}
                  isGif={editIsGif}
                  onTriggerCrop={handleEditTriggerCrop}
                  onRemove={handleEditRemoveImage}
                  isCropping={editIsCropping}
                  srcUrl={editSrcUrl}
                  crop={editCrop}
                  imgRef={editImgRef}
                  onImageLoad={onEditImageLoad}
                  onCropChange={setEditCrop}
                  onCropComplete={setEditCompletedCrop}
                  onCropSave={handleEditCropComplete}
                  onCropCancel={cancelEditCrop}
                />
              )}
            </div>
          ) : (
            <>
              <p className="mt-1 app-text text-[15px] whitespace-pre-wrap wrap-break-word">
                {renderContentWithClickableTags(displayContent)}
              </p>
              {isTruncatable && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-brand text-sm font-semibold mt-1 hover:underline"
                >
                  {expanded ? t('post_card.show_less') : t('post_card.show_more')}
                </button>
              )}
            </>
          )}

          {post.imageUrl && (
            <div className="mt-3 w-full overflow-hidden border app-border rounded-2xl flex justify-center items-center">
              {isVideoUrl ? (
                <video
                  src={post.imageUrl}
                  controls
                  preload="metadata"
                  className="w-full object-contain max-h-[50vh]"
                />
              ) : (
                <img
                  src={post.imageUrl}
                  alt="Contenu du post"
                  className="w-full object-contain max-h-[50vh]"
                  loading="lazy"
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-8 mt-3">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="post-action hover:text-blue-500"
            >
              <MessageCircle size={18} />
              <span className="text-sm">{post.commentsCount}</span>
            </button>

            <button
              onClick={onLike}
              className={`post-action ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <Heart size={18} className={post.isLiked ? 'fill-red-500' : ''} />
              <span className="text-sm">{post.likesCount}</span>
            </button>
          </div>

          {isReplying && (
            <div className="flex flex-col">
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('post_card.reply_placeholder')}
                  className="inline-input flex-1"
                />
                <div
                  className="text-brand cursor-pointer hover:opacity-80 p-1 rounded-full hover:bg-brand/10 transition-colors"
                  onClick={handleReplyIconClick}
                >
                  <ImageIcon size={20} />
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    onChange={handleReplyFileChange}
                    accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm"
                    className="hidden"
                  />
                </div>
                <button
                  onClick={submitReply}
                  disabled={!replyText.trim() && !replySelectedFile}
                  className="bg-brand text-white px-4 py-1 rounded-full text-sm font-bold disabled:opacity-50"
                >
                  {t('post_card.reply_button')}
                </button>
              </div>

              {replyPreviewUrl && replySelectedFile && (
                <MediaPreview
                  previewUrl={replyPreviewUrl}
                  isVideo={replyIsVideo}
                  isGif={replyIsGif}
                  onTriggerCrop={handleReplyTriggerCrop}
                  onRemove={handleReplyRemoveImage}
                  isCropping={replyIsCropping}
                  srcUrl={replySrcUrl}
                  crop={replyCrop}
                  imgRef={replyImgRef}
                  onImageLoad={onReplyImageLoad}
                  onCropChange={setReplyCrop}
                  onCropComplete={setReplyCompletedCrop}
                  onCropSave={handleReplyCropComplete}
                  onCropCancel={cancelReplyCrop}
                />
              )}
            </div>
          )}

          {reportFeedback && (
            <p className={`mt-3 text-sm ${reportFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {reportFeedback.message}
            </p>
          )}

          {post.replies && post.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 app-border space-y-3">
              {post.replies.map((reply) => (
                <div key={reply.id} className="text-sm">
                  <span className="font-bold mr-2">{reply.author.name}</span>
                  <span className="app-text-muted">{reply.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isReporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setIsReporting(false)}>
          <div className="w-full max-w-sm rounded-2xl border app-border app-surface-elevated p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold app-text">{t('post_card.report_title')}</h3>
            <p className="mt-1 text-sm app-text-muted">{t('post_card.report_description')}</p>

            <label className="mt-4 block text-sm font-medium app-text">
              {t('post_card.report_reason_label')}
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as ReportReason)}
                className="mt-2 w-full rounded-xl border app-input px-3 py-2 text-sm outline-none focus:border-brand"
                disabled={isSubmittingReport}
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {t(`post_card.report_reasons.${reason}`)}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReporting(false)}
                className="rounded-full border app-border px-4 py-2 text-sm font-semibold app-text app-hover-surface"
                disabled={isSubmittingReport}
              >
                {t('compose_post.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmittingReport ? t('pending') : t('post_card.report_submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}