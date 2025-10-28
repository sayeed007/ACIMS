import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | null;
}

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;

/**
 * Initialize Redis connection
 * Redis is optional - system will work without it but with reduced performance
 */
export function getRedisClient(): Redis | null {
  // Skip Redis in test environment or if URL not provided
  if (process.env.NODE_ENV === 'test' || !REDIS_URL) {
    console.log('⚠️  Redis not configured - caching disabled');
    return null;
  }

  // Return existing connection in development
  if (process.env.NODE_ENV === 'development' && global.redis) {
    return global.redis;
  }

  // Create new connection
  if (!redis) {
    try {
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
          }
          return false;
        },
      });

      redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      redis.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
      });

      redis.on('close', () => {
        console.log('Redis connection closed');
      });

      // Cache the connection in development
      if (process.env.NODE_ENV === 'development') {
        global.redis = redis;
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  return redis;
}

/**
 * Redis utility functions
 */
export const redisUtils = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;

    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set value in cache with optional expiration (in seconds)
   */
  async set<T>(key: string, value: T, expirationSeconds?: number): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (expirationSeconds) {
        await client.setex(key, expirationSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const client = getRedisClient();
    if (!client) return 0;

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error(`Redis DEL pattern error for ${pattern}:`, error);
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Get time to live for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    const client = getRedisClient();
    if (!client) return -1;

    try {
      return await client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  },
};

// Cache key generators
export const cacheKeys = {
  attendance: (employeeId: string, date: string) => `attendance:${employeeId}:${date}`,
  attendanceList: (date: string) => `attendance:list:${date}`,
  employee: (employeeId: string) => `employee:${employeeId}`,
  mealEligibility: (employeeId: string, mealSessionId: string, date: string) =>
    `eligibility:${employeeId}:${mealSessionId}:${date}`,
  mealCount: (mealSessionId: string, date: string) => `meal:count:${mealSessionId}:${date}`,
  stockBalance: (itemId: string) => `stock:balance:${itemId}`,
  deviceStatus: (deviceId: string) => `device:status:${deviceId}`,
  userSession: (userId: string) => `session:${userId}`,
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  ATTENDANCE: 900, // 15 minutes (sync interval)
  SESSION: 1800, // 30 minutes
  DAILY: 86400, // 24 hours
};

export default getRedisClient;
