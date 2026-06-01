import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@arb/trpc";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
// Subscriptions stream over SSE; never statically optimize this route.
export const dynamic = "force-dynamic";

function userIdFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
  return verifySession(value);
}

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ userId: userIdFromRequest(req) }),
  });
}

export { handler as GET, handler as POST };
