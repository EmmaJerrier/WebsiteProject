import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  eventId: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  genre: string;
  imageUrl: string;
  addedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>({
  eventId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  date: String,
  time: String,
  venue: String,
  genre: String,
  imageUrl: String,
  addedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFavorite>("Favorite", FavoriteSchema);
