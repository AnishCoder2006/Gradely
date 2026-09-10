import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from './app';

describe('GET /api/health', () => {
  it('reports that the API is running', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      message: 'API dependencies are not ready',
      dependencies: { mongo: 'down', redis: 'disabled', kafka: 'disabled' },
    });
  });
});
