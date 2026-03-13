import dbConnect from "../db";
import PriceItem, { IPriceItem } from "../models/PriceItem";

export class PriceService {
  static async getAll() {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    return await db.collection("prices").find({}).toArray() as any;
  }

  static async create(data: Partial<IPriceItem>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const result = await db.collection("prices").insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  static async update(id: string, data: Partial<IPriceItem>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    const result = await db.collection("prices").findOneAndUpdate(
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
    return await db.collection("prices").deleteOne({ _id: new ObjectId(id) });
  }
}
