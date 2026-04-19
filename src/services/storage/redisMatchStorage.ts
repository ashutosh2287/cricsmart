import { getRedis } from "./redisClient";

const getMatchKey = (matchId: string) => `match:${matchId}`;

export const saveMatch = async (matchId: string, data: unknown) => {
  const redis = getRedis();
  const key = getMatchKey(matchId);

  console.log("🔴 SAVING MATCH:", key);

  await redis.set(key, JSON.stringify(data));
};

export const getMatch = async (matchId: string) => {
  const redis = getRedis();
  const key = getMatchKey(matchId);

  console.log("🟢 LOADING MATCH:", key);

  const data = await redis.get(key);

  if (!data) {
    console.error("❌ Match not found in Redis for:", matchId);
    return null;
  }

  return JSON.parse(data as string);
};

export const deleteMatch = async (matchId: string) => {
  const redis = getRedis();
  const key = getMatchKey(matchId);

  await redis.del(key);
};