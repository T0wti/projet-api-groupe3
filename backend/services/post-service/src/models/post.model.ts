import mongoose, { Document, Schema } from 'mongoose';

export type MediaType = 'image' | 'video' | null;

export interface Media {
  type: MediaType;
  url: string | null;
  object_name?: string | null;
}

export interface IPost extends Document {
  authorId: string;
  content: string;
  media: Media;
  likesCount: number;
  commentsCount: number;
  reportsCount: number;
  parentPost: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: String, required: true },
    content: { type: String, default: '', maxlength: 280 },
    media: {
      type: {
        type: String,
        enum: ['image', 'video', null],
        default: null
      },
      url: { type: String, default: null },
      object_name: { type: String, default: null }
    },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 }, 
  },
  {
    timestamps: true
  }
);

PostSchema.pre('validate', function (next) {
  const hasContent = typeof this.content === 'string' && this.content.trim().length > 0;
  const hasMedia = !!this.media?.url;

  if (!hasContent && !hasMedia) {
    return next(new Error('A post must have either content or media.'));
  }

  next();
});

PostSchema.index({ content: 'text' });

export default mongoose.model<IPost>('Post', PostSchema);