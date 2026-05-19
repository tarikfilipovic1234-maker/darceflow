// Phase 1 stub. Phase 2 replaces this with a full Auth.js v5 configuration:
//   NextAuth({ adapter: PrismaAdapter(prisma), session: { strategy: "jwt" },
//              providers: [Credentials, Google], callbacks: { jwt, session } })
// We export the type contract now so layouts and server components can import
// `auth` and `signOut` without breaking when Phase 2 fills these in.

type NotConfigured = () => never;

const notConfigured: NotConfigured = () => {
  throw new Error("Auth not configured yet — wired up in Phase 2.");
};

export const auth = notConfigured;
export const signIn = notConfigured;
export const signOut = notConfigured;
export const handlers = {
  GET: notConfigured,
  POST: notConfigured,
};
