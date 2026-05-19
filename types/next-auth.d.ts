import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      gymId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    gymId: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    gymId: string | null;
  }
}
