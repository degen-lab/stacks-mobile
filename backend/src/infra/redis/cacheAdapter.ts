import { ICachePort } from '../../application/ports/ICachePort';
import { redis } from './redisClient';

export class RedisCacheAdapter implements ICachePort {
  async get<T>(key: string): Promise<T> {
    const response = await redis.get(key);
    if (!response) {
      throw new Error(`key ${key} not found!`);
    }
    const parsedData: T = JSON.parse(response);
    return parsedData;
  }
  async set<T>(key: string, value: T): Promise<void> {
    const parsedValue = JSON.stringify(value);
    await redis.set(key, parsedValue);
  }
  async delete(key: string): Promise<void> {
    await redis.del(key);
  }
}
