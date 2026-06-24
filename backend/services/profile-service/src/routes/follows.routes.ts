import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestedAccounts,
} from '../controllers/follows.controller';

const router = Router();

router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.delete('/follow', unfollowUser);
router.get('/suggestions', getSuggestedAccounts);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;
