import { Redis } from "@upstash/redis"

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

export async function publishDashboardEvent(event: string, payload: Record<string, unknown>) {
  if (!redis) return
  await redis.publish(`dashboard:${event}`, JSON.stringify(payload))
}

