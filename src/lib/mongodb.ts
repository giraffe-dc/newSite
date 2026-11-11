import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/* `connect()` відхиляється ще до першого `await`: модуль імпортується на
   старті сервера, а getDb() викликається пізніше. Присвоюємо обробник
   одразу — без нього Node кидає unhandledRejection. Для викликачів getDb()
   promise лишається тим самим (rejected → ловиться у siteContent). */
clientPromise.catch(() => {});

export default clientPromise;

/** Назва бази сайту — єдина точка правди (раніше була розкидана хардкодом). */
export const DB_NAME = "zhyrafyk";

/** З'єднання з базою сайту: `const db = await getDb()`. */
export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}
