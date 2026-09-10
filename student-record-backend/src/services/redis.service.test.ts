import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakeClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    connect: vi.fn(async () => undefined),
    on: vi.fn((event: string, callback: () => void) => {
        if (event === 'connect') callback();
        return fakeClient;
    }),
};

vi.mock('redis', () => ({
    createClient: vi.fn(() => fakeClient),
}));

describe('Redis cache helpers', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.env.REDIS_ENABLED = 'true';
    });

    it('handles cache hits, misses, writes, deletes, and pattern clearing', async () => {
        const redis = await import('./redis.service');
        await redis.initRedis();

        fakeClient.get.mockResolvedValueOnce(JSON.stringify({ id: 1 }));
        await expect(redis.getCache('student:1')).resolves.toEqual({ id: 1 });

        fakeClient.get.mockResolvedValueOnce(null);
        await expect(redis.getCache('student:missing')).resolves.toBeNull();

        await redis.setCache('student:1', { id: 1 }, 60);
        expect(fakeClient.set).toHaveBeenCalledWith('student:1', JSON.stringify({ id: 1 }), { EX: 60 });

        await redis.deleteCache('student:1');
        expect(fakeClient.del).toHaveBeenCalledWith('student:1');

        fakeClient.keys.mockResolvedValueOnce(['student:1', 'student:2']);
        await redis.clearCachePattern('student:*');
        expect(fakeClient.keys).toHaveBeenCalledWith('student:*');
        expect(fakeClient.del).toHaveBeenCalledWith(['student:1', 'student:2']);
    });

    it('falls back gracefully when Redis is disabled', async () => {
        process.env.REDIS_ENABLED = 'false';
        const redis = await import('./redis.service');

        await expect(redis.initRedis()).resolves.toBeNull();
        await expect(redis.getCache('disabled')).resolves.toBeNull();
        await expect(redis.setCache('disabled', { value: true })).resolves.toBeUndefined();
        expect(fakeClient.connect).not.toHaveBeenCalled();
    });
});
