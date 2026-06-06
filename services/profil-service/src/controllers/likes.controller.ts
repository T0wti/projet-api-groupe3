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

  let userLikes = await UserLikes.findOne({ user_id });

  if (userLikes) {
    if (userLikes.post_id.includes(post_id)) {
      res.status(409).json({ message: 'Post already liked' });
      return;
    }
    userLikes.post_id.push(post_id);
    await userLikes.save();
  } else {
    userLikes = new UserLikes({ user_id, post_id: [post_id] });
    await userLikes.save();
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

  const userLikes = await UserLikes.findOne({ user_id });

  if (!userLikes || !userLikes.post_id.includes(post_id)) {
    res.status(404).json({ message: 'Like not found' });
    return;
  }

  userLikes.post_id = userLikes.post_id.filter((id) => id !== post_id);
  await userLikes.save();

  res.status(200).json({ message: 'Post unliked successfully' });
};

/**
 * Get all liked posts for a user
 */
export const getUserLikes = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const userLikes = await UserLikes.findOne({ user_id: userId });

  res.status(200).json({
    user_id: userId,
    liked_posts: userLikes ? userLikes.post_id : [],
  });
};
