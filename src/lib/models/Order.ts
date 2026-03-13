import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  customerName: string;
  phone: string;
  date?: Date;
  time?: string;
  notes?: string;
  items?: {
    serviceId?: string;
    serviceName: string;
    quantity?: number;
    price?: string;
  }[];
  status: "new" | "confirmed" | "cancelled";
  createdAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: Date },
    time: { type: String },
    notes: { type: String },
    items: [
      {
        serviceId: { type: String },
        serviceName: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        price: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["new", "confirmed", "cancelled"],
      default: "new",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
