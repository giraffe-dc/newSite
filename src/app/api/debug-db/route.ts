import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  try {
    await dbConnect();
    const state = mongoose.connection.readyState;
    const dbName = mongoose.connection.db?.databaseName;
    const collections = await mongoose.connection.db?.listCollections().toArray();
    const collectionNames = collections?.map(c => (c as any).name);
    
    const newsCount = await mongoose.connection.db?.collection("news").countDocuments();
    const specificNews = await mongoose.connection.db?.collection("news").findOne({ 
      _id: new mongoose.Types.ObjectId("69a163f6bdfe36c0f4e68adf") 
    });

    const uri = process.env.MONGODB_URI || "";
    const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, "//user:pass@");

    return NextResponse.json({
      connected: state === 1,
      readyState: state,
      dbName,
      newsCount,
      foundSpecific: !!specificNews,
      maskedUri,
      collectionNames,
      models: Object.keys(mongoose.models)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
