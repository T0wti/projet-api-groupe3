import { Schema, model, Document } from 'mongoose';

/**
 * Stores the list of posts liked by a user.
 */
export interface IUserLikes extends Document {
  user_id: string;
  post_id: string;
}

const userLikesSchema = new Schema<IUserLikes>({
  user_id: { type: String, required: true},
  post_id: { type: String, required: true },
});

userLikesSchema.index({ user_id: 1, post_id: 1 }, { unique: true });
userLikesSchema.index({ post_id: 1 }); // pour "qui a liké ce post"

export const UserLikes = model<IUserLikes>('UserLikes', userLikesSchema);
