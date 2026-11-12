/** Документ новини колекції `news` (нативний драйвер mongodb;
 *  mongoose-модель прибрано в етапі 5 — див. план, п. 3). */
export interface INews {
  title: string;
  content: string;
  date?: Date | string;
  type?: "news" | "event";
  image?: string;
  images?: string[];
}

export const NewsService = {
  async getAll() {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    return await db.collection("news").find({}).sort({ date: -1 }).toArray();
  },

  async getById(id: string) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    // Import ObjectId to query by it if needed
    const { ObjectId } = await import("mongodb");

    try {
      const news = await db
        .collection("news")
        .findOne({ _id: new ObjectId(id) });
      return news;
    } catch (_e) {
      // Fallback for non-ObjectId strings
      return await db
        .collection("news")
        .findOne({ _id: id as unknown as import("mongodb").ObjectId });
    }
  },

  async create(data: Partial<INews>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const result = await db.collection("news").insertOne(data);
    return { ...data, _id: result.insertedId };
  },

  async update(id: string, data: Partial<INews>) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    const result = await db
      .collection("news")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
        { returnDocument: "after" },
      );
    return result;
  },

  async delete(id: string) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");
    const { ObjectId } = await import("mongodb");
    return await db.collection("news").deleteOne({ _id: new ObjectId(id) });
  },
};
