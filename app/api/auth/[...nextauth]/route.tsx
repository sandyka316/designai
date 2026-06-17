import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const handler = NextAuth({
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email + Password ──────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          // Kembalikan user object yang NextAuth simpan di JWT
          return {
            id: data.user_id,
            email: data.email,
            name: data.name ?? data.username,
            backendToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // ── JWT callback: simpan backendToken ke dalam JWT ────────────
    async jwt({ token, user, account }) {
      // Credentials login: user.backendToken ada
      if (user && (user as any).backendToken) {
        token.backendToken = (user as any).backendToken;
      }

      // Google login: sync ke backend untuk dapat backendToken
      if (account?.provider === "google" && token.email) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/google-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: token.email,
              name: token.name,
              image: token.picture,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.access_token;
            token.sub = data.user_id;
          }
        } catch {
          // Jika backend offline, lanjut tanpa backendToken
        }
      }

      return token;
    },

    // ── Session callback: expose accessToken ke frontend ─────────
    async session({ session, token }) {
      if (token.backendToken) {
        (session as any).accessToken = token.backendToken as string;
      }
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
