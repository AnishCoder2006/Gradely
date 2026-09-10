import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment';
import Student from '../models/Student';
import Fee from '../models/Fee';
import { AuthRequest } from '../middleware/auth.middleware';
import { isKafkaEnabled, processPaymentCompletedEvent, publishPaymentCompleted } from '../services/kafka.service';
import logger from '../config/logger';

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

// ─── POST /api/payments/create-order ─────────────────────────────────────────
// Student pays against a specific fee notice created by admin
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feeId } = req.body;
    if (!feeId) { res.status(400).json({ success: false, message: 'feeId is required.' }); return; }

    // Validate the fee exists and is active
    const fee = await Fee.findById(feeId);
    if (!fee || !fee.isActive) {
      res.status(404).json({ success: false, message: 'Fee not found or no longer active.' });
      return;
    }

    // Find student profile linked to this user
    const student = await Student.findOne({ userId: req.user!.id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    // Check if already paid
    const existing = await Payment.findOne({ feeId, studentId: student._id, status: 'paid' });
    if (existing) {
      res.status(409).json({ success: false, message: 'You have already paid this fee.' });
      return;
    }

    const amountInPaise = Math.round(fee.amount * 100);
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { studentId: student._id.toString(), feeId: fee._id.toString() },
    });

    const payment = await Payment.create({
      feeId: fee._id,
      studentId: student._id,
      userId: req.user!.id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      status: 'created',
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentDocId: payment._id,
        studentName: student.name,
        studentEmail: student.email,
        feeTitle: fee.title,
      },
    });
  } catch (err: any) {
    logger.error({ err, event: 'payment_order_creation', userId: req.user?.id }, 'payment_order_creation_failed');
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// ─── POST /api/payments/verify ────────────────────────────────────────────────
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const startedAt = Date.now();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    logger.info({ event: 'payment_verification', orderId: razorpay_order_id, paymentId: razorpay_payment_id }, 'payment_verification_attempt');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logger.warn({ event: 'payment_verification', success: false, reason: 'missing_fields', processingTimeMs: Date.now() - startedAt }, 'payment_verification_failed');
      res.status(400).json({ success: false, message: 'Missing verification fields.' });
      return;
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      await Payment.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: 'failed' });
      logger.warn({ event: 'payment_verification', orderId: razorpay_order_id, paymentId: razorpay_payment_id, success: false, reason: 'invalid_signature', processingTimeMs: Date.now() - startedAt }, 'payment_verification_failed');
      res.status(400).json({ success: false, message: 'Invalid payment signature. Payment rejected.' });
      return;
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, status: { $ne: 'paid' } },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'paid', paidAt: new Date() },
      { new: true }
    ).populate('feeId', 'title feeType amount description');

    if (!payment) {
      const existing = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      if (existing?.status === 'paid') {
        logger.info({ event: 'payment_verification', orderId: razorpay_order_id, paymentId: razorpay_payment_id, success: true, alreadyVerified: true, processingTimeMs: Date.now() - startedAt }, 'payment_verification_completed');
        res.json({ success: true, message: 'Payment was already verified.', data: existing }); return;
      }
      logger.warn({ event: 'payment_verification', orderId: razorpay_order_id, paymentId: razorpay_payment_id, success: false, reason: 'payment_not_found', processingTimeMs: Date.now() - startedAt }, 'payment_verification_failed');
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    const completedEvent = { eventId: `payment:${payment._id}:${razorpay_payment_id}`, paymentId: String(payment._id), studentId: String(payment.studentId), userId: String(payment.userId), amount: payment.amount, currency: payment.currency, paidAt: payment.paidAt!.toISOString() };
    if (isKafkaEnabled()) {
      await publishPaymentCompleted(completedEvent);
    } else {
      logger.info({ event: 'payment.completed', mode: 'synchronous-fallback' }, 'kafka_pipeline_disabled_processing_inline');
      await processPaymentCompletedEvent(completedEvent, 'synchronous-fallback');
    }

    logger.info({ event: 'payment_verification', orderId: razorpay_order_id, paymentId: razorpay_payment_id, success: true, processingTimeMs: Date.now() - startedAt }, 'payment_verification_completed');
    res.json({ success: true, message: 'Payment verified successfully.', data: payment });
  } catch (err: any) {
    logger.error({ err, event: 'payment_verification', success: false, processingTimeMs: Date.now() - startedAt }, 'payment_verification_failed');
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Razorpay confirms asynchronously. Keep this endpoint before express.json() so the exact raw body can be verified.
export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.header('x-razorpay-signature');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret || !Buffer.isBuffer(req.body)) { res.status(400).json({ success: false, message: 'Invalid webhook request.' }); return; }
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) { res.status(400).json({ success: false, message: 'Invalid webhook signature.' }); return; }
  const body = JSON.parse(req.body.toString());
  if (body.event !== 'payment.captured') { res.status(200).json({ success: true, message: 'Event ignored.' }); return; }
  const entity = body.payload?.payment?.entity;
  const payment = await Payment.findOneAndUpdate({ razorpayOrderId: entity?.order_id, status: { $ne: 'paid' } }, { status: 'paid', razorpayPaymentId: entity?.id, paidAt: new Date() }, { new: true });
  if (!payment) { res.status(200).json({ success: true, message: 'Payment already processed or unknown.' }); return; }
  const completedEvent = { eventId: `payment:${payment._id}:${entity.id}`, paymentId: String(payment._id), studentId: String(payment.studentId), userId: String(payment.userId), amount: payment.amount, currency: payment.currency, paidAt: payment.paidAt!.toISOString() };
  if (isKafkaEnabled()) {
    await publishPaymentCompleted(completedEvent);
  } else {
    await processPaymentCompletedEvent(completedEvent, 'synchronous-fallback');
  }
  res.status(200).json({ success: true });
};

// ─── GET /api/payments/my ─────────────────────────────────────────────────────
export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await Student.findOne({ userId: req.user!.id });
    if (!student) { res.status(404).json({ success: false, message: 'Student profile not found.' }); return; }

    const payments = await Payment.find({ studentId: student._id })
      .populate('feeId', 'title feeType amount description dueDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/payments  (admin) ────────────────────────────────────────────────
export const getAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, feeId, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (feeId) filter.feeId = feeId;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter)
      .populate('studentId', 'name email')
      .populate('feeId', 'title feeType amount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true, data: payments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/payments/stats  (admin) ────────────────────────────────────────
export const getPaymentStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [revResult, paidCount, pendingCount, failedCount, byFee] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.countDocuments({ status: 'paid' }),
      Payment.countDocuments({ status: 'created' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $lookup: { from: 'fees', localField: 'feeId', foreignField: '_id', as: 'fee' } },
        { $unwind: '$fee' },
        { $group: { _id: '$fee.feeType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: revResult[0]?.total ?? 0,
        paidCount, pendingCount, failedCount,
        revenueByType: byFee,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
