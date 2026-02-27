import mongoose, { Document, Schema } from 'mongoose';

export interface ILocationHours extends Document {
  name: string;
  address: string;
  mapEmbedUrl: string; // Google Maps embed URL or place link
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  hours: Array<{
    day: string; // e.g. "sunday", "monday"
    open: string; // e.g. "09:00"
    close: string; // e.g. "18:00"
    isClosed: boolean;
  }>;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DayHoursSchema = new Schema(
  {
    day: { type: String, required: true },
    open: { type: String, default: '09:00' },
    close: { type: String, default: '18:00' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const LocationHoursSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mapEmbedUrl: { type: String, required: true, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    hours: { type: [DayHoursSchema], default: [] },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILocationHours>('LocationHours', LocationHoursSchema);
