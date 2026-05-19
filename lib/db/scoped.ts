// Tenant-scoped data access. Phase 2 implements this on top of `auth()` from
// lib/auth.ts: every call reads `gymId` from the session and returns a Prisma
// client extension that auto-filters tenant tables by that gymId.
//
// Defining the API surface now keeps later commits focused on logic, not
// boilerplate.

export function getScopedDb(_gymId: string): never {
  throw new Error("getScopedDb is not implemented yet — wired up in Phase 2.");
}

export function requireSession(): never {
  throw new Error("requireSession is not implemented yet — wired up in Phase 2.");
}
