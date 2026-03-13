import mongoose, { Schema, Document } from "mongoose";

export interface IPriceItem extends Document {
  name: string;
  price: string;
  description: string;
  duration?: string;
  category: string;
  video?: string;
}

const PriceItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String },
    category: { type: String, required: true },
    video: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.PriceItem ||
  mongoose.model<IPriceItem>("PriceItem", PriceItemSchema);
