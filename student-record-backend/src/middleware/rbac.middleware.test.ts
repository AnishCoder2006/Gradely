import type { NextFunction, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { restrictTo } from './auth.middleware';
import type { AuthRequest } from './auth.middleware';

const representativeRoutes = [
    { name: 'admin payments stats', allowed: ['admin'] },
    { name: 'teacher payments list', allowed: ['admin', 'teacher'] },
    { name: 'student payment verification', allowed: ['student'] },
] as const;

const roles = ['admin', 'teacher', 'student'] as const;

const createResponse = () => {
    const response = { status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    return response as unknown as Response;
};

describe('representative RBAC route policies', () => {
    for (const route of representativeRoutes) {
        for (const role of roles) {
            const allowedRoles: readonly string[] = route.allowed;
            it(`${role} is ${allowedRoles.includes(role) ? 'allowed' : 'denied'} on ${route.name}`, () => {
                const request = { user: { id: 'user-1', role } } as AuthRequest;
                const response = createResponse();
                const next = vi.fn() as NextFunction;

                restrictTo(...route.allowed)(request, response, next);

                if (allowedRoles.includes(role)) {
                    expect(next).toHaveBeenCalledOnce();
                    expect(response.status).not.toHaveBeenCalled();
                } else {
                    expect(response.status).toHaveBeenCalledWith(403);
                    expect(next).not.toHaveBeenCalled();
                }
            });
        }
    }
});
