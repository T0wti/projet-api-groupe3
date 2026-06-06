import { Schema, model, Document } from 'mongoose';

/**
 * Represents a follow relationship document in MongoDB.
 */
export interface IFollows extends Document {
  follower_id:  string;
  following_id: string[];
  created_at:   Date;
}

const followsSchema = new Schema<IFollows>({
  follower_id:  { type: String, required: true, unique: true },
  following_id: { type: [String], default: [] },
  created_at:   { type: Date, default: Date.now },
});

export const Follows = model<IFollows>('Follows', followsSchema);
