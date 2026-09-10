import type { NextFunction, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { restrictTo } from './auth.middleware';
import type { AuthRequest } from './auth.middleware';

const createResponse = () => {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

describe('restrictTo', () => {
  it('allows a user with an accepted role', () => {
    const request = { user: { id: '1', role: 'admin' } } as AuthRequest;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    restrictTo('admin', 'teacher')(request, response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects a user without the required role', () => {
    const request = { user: { id: '1', role: 'student' } } as AuthRequest;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    restrictTo('admin')(request, response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
