import { Schema, model, Document } from 'mongoose';

/**
 * Stores the list of posts liked by a user.
 */
export interface IUserLikes extends Document {
  user_id: string;
  post_id: string[];
}

const userLikesSchema = new Schema<IUserLikes>({
  user_id: { type: String, required: true, unique: true },
  post_id: { type: [String], default: [] },
});

export const UserLikes = model<IUserLikes>('UserLikes', userLikesSchema);
