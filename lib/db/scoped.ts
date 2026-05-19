import { redirect } from "next/navigation";

import { auth, type Session } from "@/lib/auth";
import type { Role } from "@/lib/generated/prisma/enums";

/**
 * Ensure the request has a session. Redirects to /login if not.
 * Use in Server Components and Server Actions.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Ensure the user has one of the allowed roles. Otherwise redirects to /dashboard.
 */
export async function requireRole(allowed: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!allowed.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

/**
 * Ensure the user is attached to a gym (every operating user must be).
 * Returns the gymId so downstream Prisma queries can filter on it.
 */
export async function requireGymId(): Promise<{ session: Session; gymId: string }> {
  const session = await requireSession();
  if (!session.user.gymId) {
    redirect("/login");
  }
  return { session, gymId: session.user.gymId };
}
