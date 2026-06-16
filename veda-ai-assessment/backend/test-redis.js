require('dotenv').config();
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log('Connecting to:', redisUrl);
const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redisClient.on('connect', () => {
  console.log('Redis Connected Successfully');
  process.exit(0);
});

redisClient.on('error', (err) => {
  console.error(`Redis Error:`, err);
  process.exit(1);
});
