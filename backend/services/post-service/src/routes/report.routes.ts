import { Router } from 'express';
import { createReport, getReports, updateReportStatus } from '../controllers/report.controller';

const router = Router();

router.post('/', createReport);
router.get('/', getReports);
router.patch('/:id', updateReportStatus);

export default router;