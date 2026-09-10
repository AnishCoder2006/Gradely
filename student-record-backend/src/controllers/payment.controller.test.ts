import crypto from 'crypto';
import mongoose from 'mongoose';
import type { Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Payment from '../models/Payment';
import type { AuthRequest } from '../middleware/auth.middleware';
import { verifyPayment } from './payment.controller';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongo';

vi.mock('razorpay', () => ({ default: vi.fn() }));

const secret = 'test-razorpay-secret';
process.env.RAZORPAY_KEY_SECRET = secret;

const createResponse = () => {
    const response = { status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    return response as unknown as Response;
};

const createPayment = async (orderId: string) => {
    const userId = new mongoose.Types.ObjectId();
    const studentId = new mongoose.Types.ObjectId();
    return Payment.create({
        feeId: new mongoose.Types.ObjectId(),
        studentId,
        userId,
        razorpayOrderId: orderId,
        amount: 2500,
        currency: 'INR',
        status: 'created',
    });
};

const sign = (orderId: string, paymentId: string) => crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

describe('payment signature verification', () => {
    beforeAll(async () => {
        await connectTestDatabase();
        await Payment.init();
    });
    beforeEach(clearTestDatabase);
    afterAll(disconnectTestDatabase);

    it('accepts a valid Razorpay signature and marks payment paid', async () => {
        const orderId = 'order-valid';
        const paymentId = 'pay-valid';
        await createPayment(orderId);
        const request = { body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sign(orderId, paymentId) }, user: { id: 'user-1', role: 'student' } } as AuthRequest;
        const response = createResponse();

        await verifyPayment(request, response);

        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        await expect(Payment.findOne({ razorpayOrderId: orderId }).then(payment => payment?.status)).resolves.toBe('paid');
    });

    it('rejects a tampered signature and marks the payment failed', async () => {
        const orderId = 'order-tampered';
        await createPayment(orderId);
        const request = { body: { razorpay_order_id: orderId, razorpay_payment_id: 'pay-tampered', razorpay_signature: 'tampered' }, user: { id: 'user-1', role: 'student' } } as AuthRequest;
        const response = createResponse();

        await verifyPayment(request, response);

        expect(response.status).toHaveBeenCalledWith(400);
        await expect(Payment.findOne({ razorpayOrderId: orderId }).then(payment => payment?.status)).resolves.toBe('failed');
    });
});
