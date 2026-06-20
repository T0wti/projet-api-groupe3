import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Report, REPORT_REASONS } from '../models/report.model';
import Post from '../models/post.model';
import { Comment } from '../models/comment.model';
import { AppError } from '../utils/AppError';

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

export const createReport = async (req: Request, res: Response) => {
  const reporterId = req.headers['x-user-id'] as string;
  const { target_type, target_id, reason } = req.body;

  if (!reporterId) throw new AppError(401, 'Authentication required.');
  if (!target_type || !target_id || !reason) {
    throw new AppError(400, 'target_type, target_id and reason are required.');
  }
  if (!['post', 'comment'].includes(target_type)) {
    throw new AppError(400, 'target_type must be "post" or "comment".');
  }
  if (!REPORT_REASONS.includes(reason)) {
    throw new AppError(400, `reason must be one of: ${REPORT_REASONS.join(', ')}`);
  }
  if (!isValidObjectId(target_id)) throw new AppError(400, 'target_id is invalid.');

  if (target_type === 'post') {
    const target = await Post.findById(target_id);
    if (!target) throw new AppError(404, 'post not found.');
    await Post.findByIdAndUpdate(target_id, { $inc: { reportsCount: 1 } });
  } else {
    const target = await Comment.findById(target_id);
    if (!target) throw new AppError(404, 'comment not found.');
    await Comment.findByIdAndUpdate(target_id, { $inc: { reportsCount: 1 } });
  }

  const report = await Report.create({ reporter_id: reporterId, target_type, target_id, reason });

  return res.status(201).json(report);
};

export const getReports = async (req: Request, res: Response) => {
  const status = (req.query.status as string | undefined) ?? 'pending';
  const reports = await Report.find({ status }).sort({ createdAt: -1 });
  return res.status(200).json(reports);
};

export const updateReportStatus = async (req: Request, res: Response) => {
  const moderatorId = req.headers['x-user-id'] as string;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status } = req.body;

  if (!isValidObjectId(id)) throw new AppError(400, 'Report ID is invalid.');
  if (!['reviewed', 'dismissed', 'action_taken'].includes(status)) {
    throw new AppError(400, 'status must be "reviewed", "dismissed" or "action_taken".');
  }

  const report = await Report.findByIdAndUpdate(
    id,
    { status, reviewed_by: moderatorId, reviewed_at: new Date() },
    { new: true }
  );
  if (!report) throw new AppError(404, 'Report not found.');

  return res.status(200).json(report);
};