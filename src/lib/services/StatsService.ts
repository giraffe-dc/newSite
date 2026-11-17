export const StatsService = {
  async getDashboardStats({ period = "30d" } = {}) {
    const clientPromise = (await import("../mongodb")).default;
    const client = await clientPromise;
    const db = client.db("zhyrafyk");

    // Вікно часу за обраним періодом (UTC, бо в БД timestamp записується як new Date()).
    const now = new Date();
    let startDate: Date | null = null;
    if (period === "24h") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const dateMatch = startDate ? { timestamp: { $gte: startDate } } : {};

    const totalPageViews = await db
      .collection("statistics")
      .countDocuments(dateMatch);

    const uniqueVisitorsResult = await db
      .collection("statistics")
      .aggregate([
        { $match: dateMatch },
        { $group: { _id: "$ip" } },
        { $count: "count" },
      ])
      .toArray();
    const uniqueVisitors = uniqueVisitorsResult[0]?.count || 0;

    const pageViewsByPath = await db
      .collection("statistics")
      .aggregate([
        { $match: dateMatch },
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    const pageViewsPerDay = await db
      .collection("statistics")
      .aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 31 },
      ])
      .toArray();

    const topReferrers = await db
      .collection("statistics")
      .aggregate([
        { $match: { ...dateMatch, referrer: { $nin: [null, ""] } } },
        { $group: { _id: "$referrer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    const bookingsTotal = await db.collection("orders").countDocuments();

    const bookingsPerDay = await db
      .collection("orders")
      .aggregate([
        {
          $addFields: {
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
          $match: {
            ...(startDate ? { parsedDate: { $gte: startDate } } : {}),
            parsedDate: { $ne: null },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$parsedDate" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return {
      period,
      totalPageViews,
      uniqueVisitors,
      pageViewsByPath,
      pageViewsPerDay,
      topReferrers,
      bookingsTotal,
      bookingsPerDay,
    };
  },
};
