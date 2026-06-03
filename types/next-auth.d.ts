import NextAuth from "next-auth";

// Extend session type supaya TypeScript tahu ada field `id`
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
