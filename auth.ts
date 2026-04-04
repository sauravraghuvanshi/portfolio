import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// ─── Brute-force protection ───────────────────────────────────
const failedAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_FAILURES = 5;
const BASE_LOCKOUT_MS = 30_000; // 30 seconds
const MAX_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginLock(key: string): string | null {
  const entry = failedAttempts.get(key);
  if (!entry) return null;
  if (Date.now() < entry.lockUntil) {
    const secsLeft = Math.ceil((entry.lockUntil - Date.now()) / 1000);
    return `Too many failed attempts. Try again in ${secsLeft}s.`;
  }
  return null;
}

function recordFailure(key: string): void {
  const entry = failedAttempts.get(key) ?? { count: 0, lockUntil: 0 };
  entry.count++;
  if (entry.count >= MAX_FAILURES) {
    const lockout = Math.min(BASE_LOCKOUT_MS * Math.pow(2, entry.count - MAX_FAILURES), MAX_LOCKOUT_MS);
    entry.lockUntil = Date.now() + lockout;
    console.warn(`[auth] Login locked for ${lockout / 1000}s after ${entry.count} failures (key: ${key})`);
  }
  failedAttempts.set(key, entry);
}

function clearFailures(key: string): void {
  failedAttempts.delete(key);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        // Use username as brute-force key (no IP available in authorize callback)
        const key = String(credentials?.username ?? "unknown");

        const lockMsg = checkLoginLock(key);
        if (lockMsg) throw new Error(lockMsg);

        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          clearFailures(key);
          return { id: "1", name: "Saurav Raghuvanshi", email: "admin" };
        }

        recordFailure(key);
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
      const isLoginPage = pathname === "/admin/login";
      if (isLoginPage) return true;
      if (isAdmin) return !!session?.user;
      return true;
    },
  },
  trustHost: true,
});
