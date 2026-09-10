import fs from 'fs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export async function connectTestDatabase(): Promise<void> {
    const defaultWindowsBinary = 'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe';
    const systemBinary = process.env.MONGODB_SYSTEM_BINARY
        || (process.platform === 'win32' && fs.existsSync(defaultWindowsBinary) ? defaultWindowsBinary : undefined);
    mongoServer = await MongoMemoryServer.create(systemBinary ? { binary: { systemBinary } } : undefined);
    await mongoose.connect(mongoServer.getUri());
}

export async function clearTestDatabase(): Promise<void> {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map(collection => collection.deleteMany({})));
}

export async function disconnectTestDatabase(): Promise<void> {
    await mongoose.disconnect();
    await mongoServer.stop();
}
