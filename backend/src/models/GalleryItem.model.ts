import mongoose, { Document, Schema } from 'mongoose';

export type GalleryEventType = 'wedding' | 'engagement' | 'private_events';

export interface IGalleryItem extends Document {
  imageUrl: string;
  title?: string;
  eventType: GalleryEventType;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GalleryItemSchema: Schema = new Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    eventType: {
      type: String,
      enum: ['wedding', 'engagement', 'private_events'],
      required: true,
      default: 'wedding',
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IGalleryItem>('GalleryItem', GalleryItemSchema);
