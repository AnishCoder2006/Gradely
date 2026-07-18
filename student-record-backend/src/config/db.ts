// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async (): Promise<void> => {
  try {
    console.log("📁 Current directory:", __dirname);
    console.log("🔍 MONGO_URI loaded:", process.env.MONGO_URI ? "✅ YES" : "❌ NOT FOUND");

    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is missing. Check .env file location and name.');
    }

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully!');
  } catch (error: any) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;