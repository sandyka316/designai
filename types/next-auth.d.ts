import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** Backend JWT token — kirim sebagai Authorization: Bearer <accessToken> */
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Backend JWT yang didapat dari /api/auth/login atau /api/auth/google-sync */
    backendToken?: string;
  }
}
