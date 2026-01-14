import { kv } from "@vercel/kv";

// In-memory fallback cache for local development when Vercel KV is not configured
const memoryCache = new Map<string, { value: unknown; expiresAt: number | null }>();

const isKvConfigured = () => {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (isKvConfigured()) {
      const value = await kv.get<T>(key);
      return value;
    }

    // Fallback to in-memory cache
    const cached = memoryCache.get(key);
    if (!cached) return null;

    // Check if expired
    if (cached.expiresAt !== null && Date.now() > cached.expiresAt) {
      memoryCache.delete(key);
      return null;
    }

    return cached.value as T;
  },

  async set<T>(key: string, value: T, expirationInSeconds?: number) {
    if (isKvConfigured()) {
      await kv.set(key, value);
      if (expirationInSeconds && expirationInSeconds > 0) {
        await kv.expire(key, expirationInSeconds);
      }
      return;
    }

    // Fallback to in-memory cache
    memoryCache.set(key, {
      value,
      expiresAt: expirationInSeconds ? Date.now() + expirationInSeconds * 1000 : null,
    });
  },
};
