import api from '../api';

export interface MediaUploadResult {
  type: 'image' | 'video';
  url: string;
  object_name: string;
}

// Mirrors backend/services/media-service/src/middlewares/upload.middleware.ts
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export async function uploadMedia(file: File): Promise<MediaUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<MediaUploadResult>('/media', formData);
  return res.data;
}

export async function deleteMedia(objectName: string): Promise<void> {
  await api.delete(`/media/${encodeURIComponent(objectName)}`);
}
