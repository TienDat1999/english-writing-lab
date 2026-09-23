import "server-only";

import { MongoClient } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  draftwiseAdminMongoClient?: MongoClient;
};

export function getMongoClient() {
  if (!globalForMongo.draftwiseAdminMongoClient) {
    // NextAuth creates its adapter during build-time route analysis, before deployment env is available.
    const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
    globalForMongo.draftwiseAdminMongoClient = new MongoClient(uri);
  }
  return globalForMongo.draftwiseAdminMongoClient;
}
