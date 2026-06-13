import { Request, Response } from 'express';
import { UserLikes } from '../models/likes.model';

/**
 * Like a post
 */
export const likePost = async (req: Request, res: Response): Promise<void> => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    res.status(400).json({ message: 'user_id and post_id are required' });
    return;
  }

  try {
    await UserLikes.create({ user_id, post_id });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ message: 'Post already liked' });
      return;
    }
    throw err;
  }

  res.status(200).json({ message: 'Post liked successfully' });
};

/**
 * Unlike a post
 */
export const unlikePost = async (req: Request, res: Response): Promise<void> => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    res.status(400).json({ message: 'user_id and post_id are required' });
    return;
  }

  const deleted = await UserLikes.findOneAndDelete({ user_id, post_id });

  if (!deleted) {
    res.status(404).json({ message: 'Like not found' });
    return;
  }

  res.status(200).json({ message: 'Post unliked successfully' });
};

/**
 * Get all liked posts for a user
 */
export const getUserLikes = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const docs = await UserLikes.find({ user_id: userId }).select('post_id');

  res.status(200).json({
    user_id: userId,
    liked_posts: docs.map((d) => d.post_id),
  });
};

  /**
   * Get all users who liked a post
   */
export const getPostLikers = async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.params;

  const docs = await UserLikes.find({ post_id: postId }).select('user_id');

  res.status(200).json({
    post_id: postId,
    likers: docs.map((d) => d.user_id),
  });
};
