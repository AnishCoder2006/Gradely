import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Payment from '../models/Payment';
import ProcessedEvent from '../models/ProcessedEvent';
import AuditLog from '../models/AuditLog';
import { processPaymentCompletedEvent, type PaymentCompletedEvent } from './kafka.service';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../test/mongo';

describe('Kafka payment consumer idempotency', () => {
    beforeAll(async () => {
        await connectTestDatabase();
        await Promise.all([ProcessedEvent.init(), Payment.init(), AuditLog.init()]);
    });
    beforeEach(clearTestDatabase);
    afterAll(disconnectTestDatabase);

    it('processes a redelivered payment.completed event only once', async () => {
        const paymentId = new mongoose.Types.ObjectId();
        const studentId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();
        const event: PaymentCompletedEvent = {
            eventId: 'event-123',
            paymentId: paymentId.toString(),
            studentId: studentId.toString(),
            userId: userId.toString(),
            amount: 1500,
            currency: 'INR',
            paidAt: new Date().toISOString(),
        };

        await Payment.create({
            _id: paymentId,
            feeId: new mongoose.Types.ObjectId(),
            studentId,
            userId,
            razorpayOrderId: 'order-123',
            amount: event.amount,
            currency: event.currency,
            status: 'paid',
        });

        await processPaymentCompletedEvent(event);
        await processPaymentCompletedEvent(event);

        expect(await ProcessedEvent.countDocuments({ eventId: event.eventId })).toBe(1);
        expect(await AuditLog.countDocuments({ action: 'payment.completed', entityId: event.paymentId })).toBe(1);
        await expect(Payment.findById(paymentId).then(payment => payment?.receiptNumber)).resolves.toBe(`RCP-${paymentId.toString().slice(-8).toUpperCase()}`);
    });
});
