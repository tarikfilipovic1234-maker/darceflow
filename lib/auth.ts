import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import type { Role } from "@/lib/generated/prisma/enums";

export const {
  auth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Trust the localhost / preview hostname in dev. In production, set
  // AUTH_URL to your real deployment URL — Auth.js will trust that.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          gymId: user.gymId,
        } satisfies AuthorizedUser;
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // First sign-in: copy role + gymId from the User onto the JWT.
      if (user) {
        token.id = user.id as string;
        token.role = (user as AuthorizedUser).role;
        token.gymId = (user as AuthorizedUser).gymId;
        return token;
      }

      // On update() or session refresh, re-read from DB so role/gym changes propagate.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, gymId: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.gymId = fresh.gymId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.gymId = token.gymId;
      }
      return session;
    },
  },
});

type AuthorizedUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: Role;
  gymId: string | null;
};

// Re-export the augmented Session type for convenience.
export type { Session } from "next-auth";
export type SessionUser = DefaultSession["user"] & {
  id: string;
  role: Role;
  gymId: string | null;
};
