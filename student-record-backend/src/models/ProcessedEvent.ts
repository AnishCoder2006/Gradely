import mongoose, { Schema } from 'mongoose';

const ProcessedEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

export default mongoose.model('ProcessedEvent', ProcessedEventSchema);
