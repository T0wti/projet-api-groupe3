import { Router } from 'express';
import {
  likePost,
  unlikePost,
  getUserLikes,
  getPostLikers,
} from '../controllers/likes.controller';

const router = Router();

router.post('/likes', likePost);
router.delete('/likes', unlikePost);
router.get('/:userId/likes', getUserLikes);
router.get('/post/:postId/likers', getPostLikers);

export default router;
