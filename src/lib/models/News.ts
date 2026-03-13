import mongoose, { Schema, Document } from "mongoose";

export interface INews extends Document {
  title: string;
  content: string;
  date: Date;
  type: "news" | "event";
  image?: string;
  images?: string[];
  survey?: {
    question: string;
    options: {
      id: string;
      text: string;
    }[];
    allowMultiple?: boolean;
    endDate?: Date;
    results?: {
      totalVotes: number;
      optionResults: Record<string, number>;
      lastVoteAt: Date;
    };
    fields?: {
      id: string;
      label: string;
    }[];
  };
}

const NewsSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ["news", "event"], default: "news" },
    image: { type: String },
    images: [{ type: String }],
    survey: {
      question: { type: String },
      options: [
        {
          id: { type: String },
          text: { type: String },
        },
      ],
      allowMultiple: { type: Boolean, default: false },
      endDate: { type: Date },
      results: {
        totalVotes: { type: Number, default: 0 },
        optionResults: { type: Map, of: Number, default: {} },
        lastVoteAt: { type: Date },
      },
      fields: [
        {
          id: { type: String },
          label: { type: String },
        },
      ],
    },
  },
  { timestamps: true },
);

export default mongoose.models.News || mongoose.model<INews>("News", NewsSchema, "news");
