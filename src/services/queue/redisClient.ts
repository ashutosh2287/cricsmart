
import Redis from "ioredis";

const url = process.env.REDIS_URL;

export const redis = url
  ? new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 5000 })
  : new Redis({ host: "127.0.0.1", port: 6379, lazyConnect: true });