import dbConnect from "../db";
import Order, { IOrder } from "../models/Order";

export class OrderService {
  static async getAll() {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    return await db.collection("orders").find({}).sort({ createdAt: -1 }).toArray() as any;
  }

  static async create(data: Partial<IOrder>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const result = await db.collection("orders").insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  static async updateStatus(id: string, status: IOrder["status"]) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result;
  }

  static async delete(id: string) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    return await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
  }
}
