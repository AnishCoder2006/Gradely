import { createServer } from 'http';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { initSocket } from './socket';
import app from './app';
import { isKafkaEnabled, startPaymentConsumers } from './services/kafka.service';
import { initRedis } from './services/redis.service';
import logger from './config/logger';


dotenv.config();

const httpServer = createServer(app); // ← wrap express in raw HTTP server for socket.io
const PORT = process.env.PORT || 5000;

// Initialize socket.io on the same HTTP server
const startServer = async () => {
  try {
    logger.info(isKafkaEnabled()
      ? 'Kafka pipeline: ENABLED (event-driven)'
      : 'Kafka pipeline: DISABLED (synchronous fallback mode)');
    await connectDB();
    await initRedis();
    await initSocket(httpServer);
    await startPaymentConsumers();
    httpServer.listen(PORT, () => {
      logger.info({ port: PORT }, 'server_started');
      logger.info({ feature: 'socket.io' }, 'socket_ready');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'server_start_failed');
    process.exitCode = 1;
  }
};

startServer();
