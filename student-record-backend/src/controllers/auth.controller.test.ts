import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import type { Request, Response } from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import User from '../models/User';
import { protect } from '../middleware/auth.middleware';
import { authController } from './auth.controller';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongo';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const createResponse = () => {
    const response = { status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    return response as unknown as Response;
};

const createRequest = (body: Record<string, unknown>) => ({ body } as Request);

describe('authentication domain flows', () => {
    beforeAll(async () => {
        await connectTestDatabase();
        await User.init();
    });
    beforeEach(clearTestDatabase);
    afterEach(() => vi.useRealTimers());
    afterAll(disconnectTestDatabase);

    it('issues a JWT on successful login', async () => {
        await User.create({ name: 'Student One', email: 'student@example.com', password: 'password123', role: 'student' });
        const response = createResponse();

        await authController.login(createRequest({ email: 'student@example.com', password: 'password123' }), response, vi.fn());

        const body = (response.json as any).mock.calls[0][0];
        const decoded = jwt.verify(body.data.token, JWT_SECRET) as { role: string };
        expect(body.success).toBe(true);
        expect(decoded.role).toBe('student');
    });

    it('rejects an expired JWT', async () => {
        const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'student' }, JWT_SECRET, { expiresIn: -1 });
        const request = { headers: { authorization: `Bearer ${token}` }, method: 'GET', path: '/api/auth/me' } as any;
        const response = createResponse();

        await protect(request, response, vi.fn());

        expect(response.status).toHaveBeenCalledWith(401);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authorised. Invalid token.' }));
    });

    describe('TOTP verification', () => {
        const secret = 'JBSWY3DPEHPK3PXP';
        const fixedTime = new Date('2026-01-01T00:00:00.000Z');

        beforeEach(async () => {
            vi.useFakeTimers();
            vi.setSystemTime(fixedTime);
            await User.create({ name: 'Admin One', email: 'admin@example.com', password: 'password123', role: 'admin', mfaEnabled: true, mfaSecret: secret });
        });

        it('accepts a valid code', async () => {
            const response = createResponse();
            const code = authenticator.generate(secret);

            await authController.verifyMfaLogin(createRequest({ email: 'admin@example.com', code }), response, vi.fn());

            expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('rejects a wrong code', async () => {
            const response = createResponse();

            await authController.verifyMfaLogin(createRequest({ email: 'admin@example.com', code: '000000' }), response, vi.fn());

            expect(response.status).toHaveBeenCalledWith(401);
        });

        it('rejects an expired code', async () => {
            const response = createResponse();
            const code = authenticator.generate(secret);
            vi.setSystemTime(new Date(fixedTime.getTime() + 31_000));

            await authController.verifyMfaLogin(createRequest({ email: 'admin@example.com', code }), response, vi.fn());

            expect(response.status).toHaveBeenCalledWith(401);
        });
    });
});
