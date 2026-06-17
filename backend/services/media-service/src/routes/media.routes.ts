import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import { uploadMedia, deleteMedia } from '../controllers/media.controller';

const router = Router();

router.post('/', upload.single('file'), uploadMedia);
router.delete('/:objectName', deleteMedia);

export default router;