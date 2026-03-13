import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

let uri = process.env.MONGODB_URI;

// Ensure uri points to zhyrafyk database if it's a generic one
if (uri.includes("cluster0.mongodb.net") && !uri.includes("/zhyrafyk")) {
  uri = uri.replace("cluster0.mongodb.net/", "cluster0.mongodb.net/zhyrafyk");
  if (!uri.includes("/zhyrafyk")) {
     // fallback if replacement didn't work as expected
     const url = new URL(uri);
     if (url.pathname === "/" || url.pathname === "") {
       url.pathname = "/zhyrafyk";
     }
     uri = url.toString();
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn && mongoose.connection.db?.databaseName === "zhyrafyk") {
    return cached.conn;
  }

  // If wrong database, clear cache and reconnect
  if (cached.conn && mongoose.connection.db?.databaseName !== "zhyrafyk") {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "zhyrafyk",
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
