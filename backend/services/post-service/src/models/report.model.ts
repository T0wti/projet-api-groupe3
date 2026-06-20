import { Schema, model, Document, Types } from 'mongoose';

export type ReportTargetType = 'post' | 'comment';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'nudity',
  'misinformation',
  'other',
] as const;

export type ReportReason = typeof REPORT_REASONS[number];

export interface IReport extends Document {
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: Types.ObjectId;
  reason: ReportReason;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter_id: { type: String, required: true },
    target_type: { type: String, enum: ['post', 'comment'], required: true },
    target_id: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
    reviewed_by: { type: String, default: null },
    reviewed_at: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ target_type: 1, target_id: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report = model<IReport>('Report', reportSchema);
