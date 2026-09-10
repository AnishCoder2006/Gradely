import { Kafka } from 'kafkajs';
import Payment from '../models/Payment';
import ProcessedEvent from '../models/ProcessedEvent';
import { writeAuditLog } from './audit.service';
import { getIO } from '../socket';
import logger from '../config/logger';

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const enabled = process.env.KAFKA_ENABLED !== 'false';
const topic = 'payment.completed';
const kafka = new Kafka({ clientId: 'student-record-backend', brokers });
const producer = kafka.producer();
let kafkaConnected = false;

export type PaymentCompletedEvent = { eventId: string; paymentId: string; studentId: string; userId: string; amount: number; currency: string; paidAt: string };

export const isKafkaEnabled = (): boolean => enabled;

export const getKafkaStatus = (): 'up' | 'down' | 'disabled' => {
  if (!enabled) return 'disabled';
  return kafkaConnected ? 'up' : 'down';
};

export async function processPaymentCompletedEvent(event: PaymentCompletedEvent, source: 'kafka' | 'synchronous-fallback' = 'kafka'): Promise<void> {
  const startedAt = Date.now();
  try {
    await ProcessedEvent.create({ eventId: event.eventId, eventType: topic });
  } catch (error: any) {
    if (error?.code === 11000) {
      logger.debug({ eventType: topic, eventId: event.eventId, success: true, duplicate: true, processingTimeMs: Date.now() - startedAt }, 'kafka_event_already_processed');
      return;
    }
    throw error;
  }

  await writeAuditLog({ actorId: event.userId, actorRole: 'student', action: 'payment.completed', entity: 'payment', entityId: event.paymentId, metadata: { amount: event.amount, currency: event.currency, source: 'razorpay-webhook' } });
  await Payment.findByIdAndUpdate(event.paymentId, { $set: { receiptNumber: `RCP-${event.paymentId.slice(-8).toUpperCase()}` } });
  try { getIO().to(`user:${event.userId}`).emit('payment:completed', { paymentId: event.paymentId, amount: event.amount, currency: event.currency }); } catch { /* socket server may be unavailable during startup */ }
  logger.info({ eventType: topic, eventId: event.eventId, source, success: true, processingTimeMs: Date.now() - startedAt }, 'payment_event_processed');
}

export async function publishPaymentCompleted(event: PaymentCompletedEvent) {
  const startedAt = Date.now();
  if (!enabled) {
    logger.debug({ eventType: topic, success: false, skipped: true, processingTimeMs: 0 }, 'kafka_publish_skipped');
    return;
  }
  try {
    await producer.connect();
    kafkaConnected = true;
    await producer.send({ topic, messages: [{ key: event.paymentId, value: JSON.stringify(event) }] });
    logger.info({ eventType: topic, success: true, processingTimeMs: Date.now() - startedAt }, 'kafka_event_published');
  } catch (error) {
    logger.error({ err: error, eventType: topic, success: false, processingTimeMs: Date.now() - startedAt }, 'kafka_event_publish_failed');
    throw error;
  }
}

export async function startPaymentConsumers() {
  if (!enabled) {
    logger.debug({ eventType: topic, success: false, skipped: true, processingTimeMs: 0 }, 'kafka_consumer_skipped');
    return;
  }
  const consumer = kafka.consumer({ groupId: 'payment-side-effects-v1' });
  await consumer.connect();
  kafkaConnected = true;
  await consumer.subscribe({ topic, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString()) as PaymentCompletedEvent;
      await processPaymentCompletedEvent(event);
    }
  });
}
