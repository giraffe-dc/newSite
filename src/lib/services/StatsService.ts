import dbConnect from "../db";
import { MongoClient } from "mongodb";

export class StatsService {
  static async getDashboardStats() {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    const totalPageViews = await db.collection("statistics").countDocuments();
    
    const uniqueVisitorsResult = await db.collection("statistics").aggregate([
      { $group: { _id: "$ip" } },
      { $count: "count" }
    ]).toArray();
    const uniqueVisitors = uniqueVisitorsResult[0]?.count || 0;

    const pageViewsByPath = await db.collection("statistics").aggregate([
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    const pageViewsPerDay = await db.collection("statistics").aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]).toArray();

    const topReferrers = await db.collection("statistics").aggregate([
      { $match: { referrer: { $nin: [null, ""] } } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    const bookingsTotal = await db.collection("orders").countDocuments();

    const bookingsPerDay = await db.collection("orders").aggregate([
      {
        $addFields: {
          // Convert string createdAt to Date if needed, or keep existing Date
          parsedDate: {
            $convert: {
              input: "$createdAt",
              to: "date",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $match: { parsedDate: { $ne: null } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$parsedDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    return {
      totalPageViews,
      uniqueVisitors,
      pageViewsByPath,
      pageViewsPerDay,
      topReferrers,
      bookingsTotal,
      bookingsPerDay
    };
  }
}
