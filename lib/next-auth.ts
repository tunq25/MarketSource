import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import { logger } from "@/lib/logger"
import dns from "node:dns"

// ✅ FIX: Force IPv4 resolution to prevent NextAuth Google OAuth timeout (3500ms)
dns.setDefaultResultOrder("ipv4first");

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      httpOptions: { timeout: 10000 },
    })] : []),
    ...(process.env.GITHUB_CLIENT_ID ? [GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      httpOptions: { timeout: 10000 },
    })] : []),
    ...(process.env.FACEBOOK_CLIENT_ID ? [FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      httpOptions: { timeout: 10000 },
    })] : []),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Căn chỉnh với cookie JWT email/password (7d) — OAuth session không bị “cụt” hơn luồng credentials
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        token.id = user.id || (user as any).uid || account.providerAccountId;
        token.provider = account.provider;
        // ✅ SECURITY FIX: Lookup role từ DB thay vì hardcode 'user'
        try {
          const { getUserByEmail } = await import("@/lib/database");
          const dbUser = await getUserByEmail(user.email || "");
          token.role = dbUser?.role || "user";
        } catch {
          token.role = (user as any).role || "user";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).provider = token.provider as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        logger.info("New user signed in", { email: user.email });
      }
    },
  },
  debug: process.env.NODE_ENV === "development" && process.env.NEXTAUTH_DEBUG === "true",
}
