import { Router } from 'express';
import {
  likePost,
  unlikePost,
  getUserLikes,
} from '../controllers/likes.controller';

const router = Router();

router.post('/likes', likePost);
router.delete('/likes', unlikePost);
router.get('/:userId/likes', getUserLikes);

export default router;
