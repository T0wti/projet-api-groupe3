import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { minioClient, BUCKET_NAME } from '../config/minio';
import { AppError } from '../utils/AppError';

export const uploadMedia = async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    throw new AppError(401, 'Authentication required.');
  }
  if (!req.file) {
    throw new AppError(400, 'No file provided.');
  }

  const ext = req.file.originalname.split('.').pop();
  const objectName = `${userId}/${randomUUID()}.${ext}`;
  const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

  await minioClient.putObject(BUCKET_NAME, objectName, req.file.buffer, req.file.size, {
    'Content-Type': req.file.mimetype,
  });

  const publicUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${BUCKET_NAME}/${objectName}`;

  return res.status(201).json({ type: mediaType, url: publicUrl, object_name: objectName });
};

export const deleteMedia = async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  const userRole = req.headers['x-user-role'] as string | undefined;
  if (!userId) {
    throw new AppError(401, 'Authentication required.');
  }

  const objectName = Array.isArray(req.params.objectName) ? req.params.objectName[0] : req.params.objectName;

  const isOwner = objectName.startsWith(`${userId}/`);
  const canModerate = userRole === 'moderator' || userRole === 'admin';
  if (!isOwner && !canModerate) {
    throw new AppError(403, 'You are not allowed to delete this media.');
  }

  await minioClient.removeObject(BUCKET_NAME, objectName);
  return res.status(200).json({ message: 'Media deleted successfully.' });
};
