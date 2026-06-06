import { Request, Response } from 'express';
import { Follows } from '../models/follows.model';
import { UserCounters } from '../models/userCounters.model';

/**
 * Follow a user
 */
export const followUser = async (req: Request, res: Response): Promise<void> => {
  const { follower_id, following_id } = req.body;

  if (!follower_id || !following_id) {
    res.status(400).json({ message: 'follower_id and following_id are required' });
    return;
  }

  if (follower_id === following_id) {
    res.status(400).json({ message: 'Cannot follow yourself' });
    return;
  }

  let follows = await Follows.findOne({ follower_id });

  if (follows) {
    if (follows.following_id.includes(following_id)) {
      res.status(409).json({ message: 'Already following this user' });
      return;
    }
    follows.following_id.push(following_id);
    await follows.save();
  } else {
    follows = new Follows({ follower_id, following_id: [following_id] });
    await follows.save();
  }

  await UserCounters.findOneAndUpdate(
    { user_id: follower_id },
    { $inc: { following_count: 1 } },
    { upsert: true }
  );
  await UserCounters.findOneAndUpdate(
    { user_id: following_id },
    { $inc: { followers_count: 1 } },
    { upsert: true }
  );

  res.status(200).json({ message: 'User followed successfully' });
};


/**
 * Unfollow a user
 */
export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  const { follower_id, following_id } = req.body;

  if (!follower_id || !following_id) {
    res.status(400).json({ message: 'follower_id and following_id are required' });
    return;
  }

  const follows = await Follows.findOne({ follower_id });

  if (!follows || !follows.following_id.includes(following_id)) {
    res.status(404).json({ message: 'Follow relationship not found' });
    return;
  }

  follows.following_id = follows.following_id.filter((id) => id !== following_id);
  await follows.save();

  await UserCounters.findOneAndUpdate(
    { user_id: follower_id },
    { $inc: { following_count: -1 } }
  );
  await UserCounters.findOneAndUpdate(
    { user_id: following_id },
    { $inc: { followers_count: -1 } }
  );

  res.status(200).json({ message: 'User unfollowed successfully' });
};

/**
 * Get list of followers of a user
 */
export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const followDocs = await Follows.find({ following_id: userId });
  const followers = followDocs.map((doc) => doc.follower_id);

  res.status(200).json({ user_id: userId, followers });
};

/**
 * Get list of users followed by a user
 */
export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const followDoc = await Follows.findOne({ follower_id: userId });
  const following = followDoc ? followDoc.following_id : [];

  res.status(200).json({ user_id: userId, following });
};
