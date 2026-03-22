import mongoose from "mongoose";

import { env, getRequiredMongoUri } from "@/backend/config/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };

global.mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set("strictQuery", true);

    cache.promise = mongoose.connect(getRequiredMongoUri(), {
      dbName: "FiscalSnap",
      autoIndex: env.NODE_ENV !== "production",
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
