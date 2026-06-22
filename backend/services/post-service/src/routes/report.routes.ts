import { Router } from 'express';
import {
  createReport,
  getReports,
  getReportsByPost,
  getReportsByComment,
  updateReportStatus,
} from '../controllers/report.controller';

const router = Router();

router.post('/', createReport);
router.get('/', getReports);
router.get('/post/:postId', getReportsByPost);
router.get('/comment/:commentId', getReportsByComment);
router.patch('/:id', updateReportStatus);

export default router;
