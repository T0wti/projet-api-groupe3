import { Request, Response } from 'express';
import { Profile } from '../models/profile.model';
import { UserCounters } from '../models/userCounters.model';
import { AppError } from '../utils/AppError';

/**
 * Create a new user profile
 * Also initializes user counters (followers/following)
 */
export const createProfile = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.headers['x-user-id'] as string | undefined;
  const { bio, avatar_url } = req.body;

  if (!user_id) {
    throw new AppError(401, 'Authentication required');
  }

  const existing = await Profile.findOne({ user_id });
  if (existing) {
    throw new AppError(409, 'Profile already exists');
  }

  const profile = new Profile({ user_id, bio, avatar_url });
  await profile.save();

  await UserCounters.create({ user_id, followers_count: 0, following_count: 0 });

  res.status(201).json(profile);
};

/**
 * Get a user profile + counters
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const profile = await Profile.findOne({ user_id: userId });
  if (!profile) {
    throw new AppError(404, 'Profile not found');
  }

  const counters = await UserCounters.findOne({ user_id: userId });
  res.status(200).json({ ...profile.toObject(), counters });
};

/**
 * Update profile fields (partial update)
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { bio, avatar_url } = req.body;

  const profile = await Profile.findOneAndUpdate(
    { user_id: userId },
    {
      ...(bio !== undefined && { bio }),
      ...(avatar_url !== undefined && { avatar_url }),
    },
    { new: true }
  );

  if (!profile) {
    throw new AppError(404, 'Profile not found');
  }

  res.status(200).json(profile);
};

/**
 * Delete a profile and associated counters
 */
export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const profile = await Profile.findOneAndDelete({ user_id: userId });
  if (!profile) {
    throw new AppError(404, 'Profile not found');
  }

  await UserCounters.deleteOne({ user_id: userId });

  res.status(200).json({ message: 'Profile deleted' });
};
