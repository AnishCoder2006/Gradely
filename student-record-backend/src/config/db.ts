// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import logger from './logger';

// Force load .env from current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async (): Promise<void> => {
  try {
    logger.debug({ directory: __dirname, mongoUriConfigured: Boolean(process.env.MONGO_URI) }, 'database_configuration_loaded');

    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is missing. Check .env file location and name.');
    }

    await mongoose.connect(mongoURI);
    logger.info('database_connected');
  } catch (error: any) {
    logger.fatal({ err: error }, 'database_connection_failed');
    process.exit(1);
  }
};

export default connectDB;