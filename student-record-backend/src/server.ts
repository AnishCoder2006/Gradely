import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { initSocket } from './socket';

import authRoutes         from './routes/auth.routes';
import userRoutes         from './routes/user.routes';
import studentRoutes      from './routes/student.routes';
import courseRoutes       from './routes/course.routes';
import gradeRoutes        from './routes/grades.routes';
import attendanceRoutes   from './routes/attendance.routes';
import announcementRoutes from './routes/announcement.routes';
import doubtRoutes        from './routes/doubt.routes';
import paymentRoutes      from './routes/payment.routes';
import feeRoutes          from './routes/fee.routes';

import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const httpServer = createServer(app); // ← wrap express in raw HTTP server for socket.io
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/grades',        gradeRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/doubts',        doubtRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/fees',          feeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API running ✅' });
});

app.use(errorHandler);

// Initialize socket.io on the same HTTP server
initSocket(httpServer);

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.io ready for real-time connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();