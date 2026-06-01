import Redis, { type RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  __arbRedis?: Redis;
};

function createClient(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set. Copy .env.example to .env and configure it.");
  }
  const opts: RedisOptions = {
    // Blocking reads (XREAD BLOCK) require commands to wait; keep retries sane.
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
  return new Redis(url, opts);
}

/**
 * Shared non-blocking client (XADD, status, etc.). Reused across warm
 * invocations. Do NOT issue blocking reads on this client; create a
 * dedicated connection for `XREAD BLOCK` so it cannot stall other commands.
 */
export const redis: Redis = globalForRedis.__arbRedis ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalForRedis.__arbRedis = redis;
}

/** A fresh dedicated connection for blocking reads. Caller must `.quit()`. */
export function createBlockingConnection(): Redis {
  return createClient();
}
