import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticateAdminCredentials } from "@/server/admin-credentials";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Tên đăng nhập", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      authorize: authenticateAdminCredentials,
    }),
  ],
  pages: { signIn: "/login" },
  session: { maxAge: 8 * 60 * 60, strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
