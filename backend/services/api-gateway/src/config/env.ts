import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8080;

const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret) {
  throw new Error('JWT_SECRET is not defined');
}
export const JWT_SECRET: string = rawJwtSecret;

export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

export const SERVICE_TARGETS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:5001',
  user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  post: process.env.POST_SERVICE_URL || 'http://post-service:3003',
  profile: process.env.PROFILE_SERVICE_URL || 'http://profile-service:3004',
  media: process.env.MEDIA_SERVICE_URL || 'http://media-service:3005',
} as const;

export type ServiceName = keyof typeof SERVICE_TARGETS;
