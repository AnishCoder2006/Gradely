import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import studentRoutes from './routes/student.routes';
import courseRoutes from './routes/course.routes';
import gradeRoutes from './routes/grades.routes';
import attendanceRoutes from './routes/attendance.routes';
import announcementRoutes from './routes/announcement.routes';
import doubtRoutes from './routes/doubt.routes';
import paymentRoutes from './routes/payment.routes';
import feeRoutes from './routes/fee.routes';
import auditLogRoutes from './routes/auditLog.routes';
import { errorHandler } from './middleware/error.middleware';
import { razorpayWebhook } from './controllers/payment.controller';
import logger from './config/logger';
import mongoose from 'mongoose';
import { getKafkaStatus } from './services/kafka.service';
import { isRedisEnabled, isRedisReady } from './services/redis.service';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(pinoHttp({
  logger,
  serializers: {
    req: (req) => ({ method: req.method, path: req.url.split('?')[0] }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.get('/api/health', (_req, res) => {
  const dependencies = {
    mongo: mongoose.connection.readyState === 1 ? 'up' : 'down',
    redis: !isRedisEnabled() ? 'disabled' : isRedisReady() ? 'up' : 'down',
    kafka: getKafkaStatus(),
  } as const;
  const healthy = Object.values(dependencies).every(status => status !== 'down');
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'API running' : 'API dependencies are not ready',
    dependencies,
  });
});

app.use(errorHandler);

export default app;
