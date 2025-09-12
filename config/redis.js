import Redis from 'ioredis';

// Upstash Redis URL format
const REDIS_URL = process.env.REDIS_URL;

const redisClient = new Redis(REDIS_URL, {
  tls: {
    rejectUnauthorized: true  // Enable TLS for Upstash
  },
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('ready', () => console.log('Redis Client Ready'));

export default redisClient; 