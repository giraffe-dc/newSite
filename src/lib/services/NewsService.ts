import dbConnect from "../db";
import News, { INews } from "../models/News";

export class NewsService {
  static async getAll() {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    return await db.collection("news").find({}).sort({ date: -1 }).toArray() as any;
  }

  static async getById(id: string) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    
    // Import ObjectId to query by it if needed
    const { ObjectId } = await import("mongodb");
    
    try {
      const news = await db.collection("news").findOne({ _id: new ObjectId(id) });
      return news;
    } catch (e) {
      // Fallback for non-ObjectId strings
      return await db.collection("news").findOne({ _id: id as any });
    }
  }

  static async create(data: Partial<INews>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const result = await db.collection("news").insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  static async update(id: string, data: Partial<INews>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    const result = await db.collection("news").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: "after" }
    );
    return result;
  }

  static async delete(id: string) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    return await db.collection("news").deleteOne({ _id: new ObjectId(id) });
  }
}
