import mongoose, { Schema, Document } from "mongoose";

export interface ICafeItem extends Document {
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
}

const CafeItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    category: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.CafeItem ||
  mongoose.model<ICafeItem>("CafeItem", CafeItemSchema);
