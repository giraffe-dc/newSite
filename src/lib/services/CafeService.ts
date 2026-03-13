import dbConnect from "../db";
import CafeItem, { ICafeItem } from "../models/CafeItem";

export class CafeService {
  static async getAll() {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    return await db.collection("cafe_items").find({}).toArray() as any;
  }

  static async create(data: Partial<ICafeItem>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const result = await db.collection("cafe_items").insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  static async update(id: string, data: Partial<ICafeItem>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    const result = await db.collection("cafe_items").findOneAndUpdate(
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
    return await db.collection("cafe_items").deleteOne({ _id: new ObjectId(id) });
  }
}
