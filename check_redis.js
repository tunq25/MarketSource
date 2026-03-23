require('dotenv').config();
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
console.log('Testing Redis...');
redis.ping().then(res => console.log('Redis Ping:', res)).catch(err => console.error('Redis Error:', err.message));
