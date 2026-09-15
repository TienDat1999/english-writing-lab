import "server-only";

import { MongoClient } from "mongodb";

import { getServerEnv } from "@/config/env";

const globalForMongo = globalThis as typeof globalThis & {
  authMongoClient?: MongoClient;
};

export function getMongoClient(): MongoClient {
  if (!globalForMongo.authMongoClient) {
    globalForMongo.authMongoClient = new MongoClient(
      getServerEnv().MONGODB_URI,
    );
  }

  return globalForMongo.authMongoClient;
}

