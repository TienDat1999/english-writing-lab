import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { getMongoClient } from "@/server/db/mongodb-client";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getMongoClient, {
    databaseName: process.env.MONGODB_DB ?? "english_study",
  }),
  providers: [Google],
  pages: { signIn: "/login" },
  session: { strategy: "database" },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

